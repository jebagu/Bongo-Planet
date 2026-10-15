# Bongo Planet — actual01 diagnosis timing correction

The preserved Actual01-Diagnosis.md states29.393666ms after the Node resume request. That label is incorrect:29.393666ms is after the Node resume ACK. The request-relative interval is29.795666ms. All are same-process Node performance timestamps: clock-error3729.035291ms, resume request3699.239625ms, resume ACK3699.641625ms. The original Actual01-Readback.json already retains the correct request-relative29.795666ms value.

The failed acquisition, below-cap21318B maximum, native parent admission error, unchanged source/caps, unknown precise callback interleaving and no pressure qualification remain unchanged. Original diagnosis/readback/manifest bytes are preserved; this addendum corrects only the prose timing reference. Actual-IndependentReview.md independently uses the ACK-relative convention.
