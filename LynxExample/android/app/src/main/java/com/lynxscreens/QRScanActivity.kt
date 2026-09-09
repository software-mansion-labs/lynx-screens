package com.lynxscreens

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.zxing.BarcodeFormat
import com.google.zxing.ResultPoint
import com.google.zxing.client.android.Intents
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import com.journeyapps.barcodescanner.DefaultDecoderFactory

/** Returns the scanned text to the caller; adapted from LynxExplorer. */
class QRScanActivity : AppCompatActivity() {
    private lateinit var barcodeView: DecoratedBarcodeView

    private val callback = object : BarcodeCallback {
        override fun barcodeResult(result: BarcodeResult) {
            setResult(Activity.RESULT_OK, Intent().putExtra(EXTRA_RESULT, result.text))
            finish()
        }

        override fun possibleResultPoints(resultPoints: List<ResultPoint>) = Unit
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan)

        barcodeView = findViewById(R.id.barcode_scanner)
        barcodeView.initializeFromIntent(intent)
        barcodeView.barcodeView.decoderFactory =
            DefaultDecoderFactory(listOf(BarcodeFormat.QR_CODE), null, null, Intents.Scan.MIXED_SCAN)
        barcodeView.decodeSingle(callback)
    }

    override fun onResume() {
        super.onResume()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
            == PackageManager.PERMISSION_GRANTED
        ) {
            barcodeView.resume()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), CAMERA_REQUEST)
        }
    }

    override fun onPause() {
        super.onPause()
        barcodeView.pause()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == CAMERA_REQUEST &&
            grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        ) {
            barcodeView.resume()
        } else if (requestCode == CAMERA_REQUEST) {
            finish()
        }
    }

    companion object {
        const val EXTRA_RESULT = "scan_result"
        private const val CAMERA_REQUEST = 250
    }
}
