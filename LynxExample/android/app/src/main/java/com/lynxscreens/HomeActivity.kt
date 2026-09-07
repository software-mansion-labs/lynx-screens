package com.lynxscreens

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ListView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult
import androidx.appcompat.app.AppCompatActivity

/**
 * Where a bundle URL comes from, so none of them are baked into the sources.
 * Modelled on LynxExplorer's home page, minus its Lynx-card machinery.
 */
class HomeActivity : AppCompatActivity() {
    private lateinit var input: EditText

    private val scan = registerForActivityResult(StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            open(result.data?.getStringExtra(QRScanActivity.EXTRA_RESULT).orEmpty())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_home)

        input = findViewById(R.id.url)
        input.setText(history().firstOrNull().orEmpty())

        findViewById<Button>(R.id.open).setOnClickListener { open(input.text.toString()) }
        findViewById<Button>(R.id.scan).setOnClickListener {
            scan.launch(Intent(this, QRScanActivity::class.java))
        }

        showHistory()
    }

    private fun showHistory() {
        val urls = history()
        findViewById<ListView>(R.id.history).apply {
            adapter = ArrayAdapter(this@HomeActivity, android.R.layout.simple_list_item_1, urls)
            setOnItemClickListener { _, _, position, _ -> open(urls[position]) }
        }
    }

    private fun open(url: String) {
        val trimmed = url.trim()

        if (trimmed.isEmpty()) {
            Toast.makeText(this, "Enter a bundle URL first", Toast.LENGTH_SHORT).show()
            return
        }

        remember(trimmed)
        startActivity(
            Intent(this, MainActivity::class.java).putExtra(MainActivity.EXTRA_URL, trimmed),
        )
    }

    private fun prefs() = getSharedPreferences("home", MODE_PRIVATE)

    private fun history(): List<String> =
        prefs().getString(KEY_HISTORY, null)
            ?.split('\n')
            ?.filter { it.isNotBlank() }
            ?: emptyList()

    private fun remember(url: String) {
        val urls = (listOf(url) + history().filterNot { it == url }).take(HISTORY_LIMIT)

        prefs().edit().putString(KEY_HISTORY, urls.joinToString("\n")).apply()
        showHistory()
    }

    private companion object {
        const val KEY_HISTORY = "history"
        const val HISTORY_LIMIT = 10
    }
}
