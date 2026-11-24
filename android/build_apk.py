#!/usr/bin/env python3
"""Build and sign the String Bench apps (guitar, mandolin, ukulele) as Android APKs without Android Studio or the SDK.

Needs: python3, java (JDK 17+), node/npm (only to fetch the tools the first time).
Tools are pulled from npm: aapt2 (aaptjs3) plus apktool.jar and apksigner.jar (@postar/apktool-node).
The app shell is three small smali classes (a WebView activity, a mic-permission handler and a
save-file/keep-awake bridge) so no Java-to-dex compiler is needed.

Set KS_PASS to your keystore password before building; never commit it.

Usage:  python3 android/build_apk.py   -> android/build/string/string-bench.apk
"""
import os, re, shutil, struct, subprocess, sys, tarfile, tempfile, zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TOOLS = Path(os.environ.get('CB_TOOLS', HERE / 'tools'))
OUT = HERE / 'build'
KEYSTORE = HERE / 'chordbench.keystore'
KS_PASS = os.environ.get('KS_PASS', '')
if not KS_PASS:
    sys.exit('Set the KS_PASS environment variable to your keystore password before building.')
MIN_SDK, TARGET_SDK = 29, 34
# One app, three instruments (picked inside the app). It keeps the original Chord Bench package id so it
# installs over the guitar app and keeps that app's saved data.
APP = {'id': 'string', 'app': 'String Bench', 'folder': 'String Bench', 'package': 'com.chordbench.app',
       'versionCode': 12, 'versionName': '2.2.2'}

WEB = ['index.html', 'style.css', 'fonts.css', 'chords.js', 'chart.js', 'dsp.js', 'store.js', 'audio.js', 'diagram.js',
       'ui.js', 'screens.js', 'modes.js', 'app.js']


def run(cmd, **kw):
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, **kw)
    out = '\n'.join(l for l in (r.stdout + r.stderr).splitlines() if 'JAVA_TOOL_OPTIONS' not in l)
    if r.returncode != 0:
        sys.exit('FAILED: ' + ' '.join(str(c) for c in cmd) + '\n' + out)
    return out


def fetch_tools():
    need = ['aapt2', 'apktool.jar', 'apksigner.jar']
    if all((TOOLS / n).exists() for n in need):
        return
    print('fetching build tools from npm ...')
    TOOLS.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        for pkg in ('aaptjs3', '@postar/apktool-node'):
            run(['npm', 'pack', pkg, '--silent'], cwd=td)
        for tgz in Path(td).glob('*.tgz'):
            with tarfile.open(tgz) as t:
                for m in t.getmembers():
                    base = {'package/bin/x64/linux/aapt2': 'aapt2', 'package/lib/apktool.jar': 'apktool.jar',
                            'package/lib/apksigner.jar': 'apksigner.jar'}.get(m.name)
                    if base:
                        (TOOLS / base).write_bytes(t.extractfile(m).read())
    (TOOLS / 'aapt2').chmod(0o755)


def framework():
    fw = TOOLS / 'framework.jar'
    if not fw.exists():
        with zipfile.ZipFile(TOOLS / 'apktool.jar') as z:
            fw.write_bytes(z.read('brut/androlib/android-framework.jar'))
    return fw


def stage_assets(dst):
    if dst.exists():
        shutil.rmtree(dst)
    (dst / 'fonts').mkdir(parents=True)
    for f in WEB:
        s = (ROOT / f).read_text(encoding='utf-8')
        (dst / f).write_text(s, encoding='utf-8')
    shutil.copytree(ROOT / 'instruments', dst / 'instruments')
    for f in (ROOT / 'fonts').glob('*.woff2'):
        shutil.copy(f, dst / 'fonts' / f.name)


def assemble_dex(smali_dir, out_dex):
    cls = OUT / 'asm-classes'
    cls.mkdir(parents=True, exist_ok=True)
    run(['javac', '-cp', TOOLS / 'apktool.jar', '-d', cls, HERE / 'tools-src' / 'Asm.java'])
    run(['java', '-cp', f'{cls}{os.pathsep}{TOOLS / "apktool.jar"}', 'Asm', smali_dir, out_dex, str(MIN_SDK)])


def build_resources(assets, out_apk, res_dirs, manifest, version_code, version_name):
    aapt2 = TOOLS / 'aapt2'
    zips = []
    for i, d in enumerate(res_dirs):
        z = out_apk.parent / f'res{i}.zip'
        run([aapt2, 'compile', '--dir', d, '-o', z])
        zips.append(z)
    run([aapt2, 'link', '-o', out_apk, '-I', framework(), '--manifest', manifest,
         '--min-sdk-version', MIN_SDK, '--target-sdk-version', TARGET_SDK,
         '--version-code', version_code, '--version-name', version_name,
         '-A', assets] + zips + ['--auto-add-overlay'])


def zip_aligned(base_apk, dex, dst):
    """Re-pack the aapt2 output plus classes.dex. resources.arsc and media are stored uncompressed and
    4-byte aligned, which Android 11+ requires for apps targeting API 30+."""
    stored = ('.arsc', '.png', '.woff2')
    with zipfile.ZipFile(base_apk) as zin, zipfile.ZipFile(dst, 'w') as zout:
        items = [(i.filename, zin.read(i.filename)) for i in zin.infolist() if not i.is_dir()]
        items.append(('classes.dex', dex.read_bytes()))
        items.sort(key=lambda kv: (kv[0] != 'AndroidManifest.xml', kv[0] != 'classes.dex', kv[0]))
        for name, data in items:
            zi = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
            if name.endswith(stored):
                zi.compress_type = zipfile.ZIP_STORED
                pad = (-(zout.fp.tell() + 30 + len(name.encode()))) % 4
                zi.extra = b'\x00' * pad
            else:
                zi.compress_type = zipfile.ZIP_DEFLATED
            zout.writestr(zi, data)


def ensure_keystore():
    if KEYSTORE.exists():
        return
    run(['keytool', '-genkeypair', '-keystore', KEYSTORE, '-storepass', KS_PASS, '-keypass', KS_PASS,
         '-alias', 'chordbench', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000',
         '-dname', 'CN=Chord Bench, O=Personal'])



def build():
    info = APP
    out = OUT / info['id']
    out.mkdir(parents=True, exist_ok=True)
    assets = out / 'assets'
    stage_assets(assets)
    man = out / 'AndroidManifest.xml'
    man.write_text((HERE / 'AndroidManifest.xml').read_text().replace('@PACKAGE@', info['package']).replace('@LABEL@', info['app']))
    smali = out / 'smali'
    if smali.exists():
        shutil.rmtree(smali)
    shutil.copytree(HERE / 'smali', smali)
    for f in smali.rglob('*.smali'):
        f.write_text(f.read_text().replace('@FOLDER@', info['folder']))
    dex = out / 'classes.dex'
    assemble_dex(smali, dex)
    base = out / 'base.apk'
    build_resources(assets, base, [HERE / 'res', HERE / 'res-icons' / info['id']], man, info['versionCode'], info['versionName'])
    unsigned = out / 'unsigned.apk'
    zip_aligned(base, dex, unsigned)
    ensure_keystore()
    apk = out / (info['app'].lower().replace(' ', '-') + '.apk')
    run(['java', '-jar', TOOLS / 'apksigner.jar', 'sign', '--ks', KEYSTORE, '--ks-pass', f'pass:{KS_PASS}',
         '--key-pass', f'pass:{KS_PASS}', '--min-sdk-version', MIN_SDK,
         '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--out', apk, unsigned])
    v = run(['java', '-jar', TOOLS / 'apksigner.jar', 'verify', '--verbose', '--min-sdk-version', MIN_SDK, apk])
    print(f"{info['app']}: {info['package']} {info['versionName']} ({info['versionCode']}) -> {apk} ({apk.stat().st_size // 1024} KB), "
          + ('signature verifies' if 'Verifies' in v else 'SIGNATURE PROBLEM'))


def main():
    OUT.mkdir(exist_ok=True)
    fetch_tools()
    build()


if __name__ == '__main__':
    main()
