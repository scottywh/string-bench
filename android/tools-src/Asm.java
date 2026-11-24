import brut.androlib.src.SmaliBuilder;
import brut.directory.ExtFile;
import java.io.File;

/** Assembles a directory of .smali files into classes.dex using the smali bundled in apktool. */
public class Asm {
    public static void main(String[] a) throws Exception {
        SmaliBuilder.build(new ExtFile(a[0]), new File(a[1]), Integer.parseInt(a[2]));
        System.out.println("assembled -> " + a[1]);
    }
}
