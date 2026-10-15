# Bongo Planet native input position diagnosis

The native tap matched all 28,898,048 expected samples exactly. Fourteen observer clock step anomalies occurred across six occasions, including two occasions with two repeated clock values. Native audio samples advanced continuously despite these recorded clock anomalies.

The large input mismatch count in the initial fixed-position comparison is caused by one different phenomenon. At recorder block 101551, raw input offset 12991872 and context frame 13033344 (271.528 seconds), the virtual input contains exactly 128 zeros. Both recorded input lengths remain 128, source is one channel, and virtual input is two channels with its first channel captured. The native source tap remains exact at this location. There is no observer clock anomaly in the surrounding seven-block window.

At block 101552 the input resumes the expected native sequence 128 sample positions later. All remaining full input blocks exactly match that shifted known sequence. Thus the persistent input mismatch count does not describe millions of independently corrupted samples. It describes one zero block and a lasting 128-sample increase in observed route delay (640 to 768 samples).

This is read-only diagnosis. Original samples are not shifted or repaired; the separate input-position analysis records the matching native indices. The seven-block source/input window and original metadata are retained. The result identifies an observed difference beyond the native tap, but does not attribute it to a virtual driver, output graph, browser media pipeline, or recorder implementation. Audible effect was not assessed.
