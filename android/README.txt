String Bench: one app for guitar, mandolin, ukulele, banjo and cigar box guitar
=======================================================
Pick the instrument on the Home screen (and the tuning, where an instrument has several). Each instrument is a small file
in instruments/ (tuning, chord shapes, songs, detector ranges, accent colour) and keeps its own progress per tuning.
Switching reloads the app. An instrument can list several `tunings` (see instruments/cigarbox.js).

Install: copy the .apk to an Android 10+ phone, open it, allow "Install unknown apps". Play Protect may say the
developer is unrecognized (the APK is self-signed): choose Install anyway. The first time you listen, allow Microphone.
It uses the original Chord Bench package id, so it installs over Chord Bench and keeps that app's guitar data.
The separate Mandolin Bench and Ukulele Bench apps are independent; export a JSON backup there if you want to keep progress.
Exports and recordings go to Downloads/String Bench/.

Rebuild without Android Studio:   python3 android/build_apk.py
(needs python3, a JDK 17+, node/npm; it downloads aapt2/apktool/apksigner from npm the first time.)
Output: android/build/string/string-bench.apk, signed with android/chordbench.keystore (password: chordbench).
KEEP THAT KEYSTORE. Updates only install over an existing app if signed with the same key.

Add an instrument: copy instruments/ukulele.js, change the tuning and chord list, then list it in
instruments/select.js and index.html. Test detection with  INST=<id> TUNING=<tid> node test_detect.js
Dev in a browser: open index.html over https or localhost (instrument choice is saved in localStorage).
