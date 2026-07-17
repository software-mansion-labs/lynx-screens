package com.lynxscreens.providers

import android.util.Log
import com.lynx.tasm.resourceprovider.LynxResourceCallback
import com.lynx.tasm.resourceprovider.LynxResourceRequest
import com.lynx.tasm.resourceprovider.LynxResourceResponse
import com.lynx.tasm.resourceprovider.generic.LynxGenericResourceFetcher
import com.lynx.tasm.resourceprovider.generic.StreamDelegate
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import java.io.IOException

class GenericResourceFetcher : LynxGenericResourceFetcher() {
    override fun fetchResource(
        request: LynxResourceRequest?,
        callback: LynxResourceCallback<ByteArray>
    ) {
        if (request == null) {
            callback.onResponse(onFailed(Throwable("request is null!")))
            return
        }

        val retrofit = Retrofit.Builder().baseUrl("https://example.com/").build()
        val templateApi: TemplateApi = retrofit.create(TemplateApi::class.java)

        val call: Call<ResponseBody> = templateApi.getTemplate(request.url)
  
        call.enqueue(object : Callback<ResponseBody?> {
            override fun onResponse(call: Call<ResponseBody?>, response: Response<ResponseBody?>) {
                try {
                    if (response.body() != null) {
                        val responseBytes = response.body()!!.bytes()
                        Log.d("DemoGenericResourceFetcher", "Response bytes: ${responseBytes.size} bytes")
                        callback.onResponse(
                            LynxResourceResponse.onSuccess(responseBytes)
                        )
                    } else {
                        callback.onResponse(onFailed(Throwable("response body is null.")))
                    }
                } catch (e: IOException) {
                    e.printStackTrace()
                    callback.onResponse(onFailed(e))
                }
            }

            override fun onFailure(call: Call<ResponseBody?>, throwable: Throwable) {
                callback.onResponse(onFailed(throwable))
            }
        })
    }

    override fun fetchResourcePath(
        request: LynxResourceRequest, callback: LynxResourceCallback<String>
    ) {
        callback.onResponse(onFailed(Throwable("fetchResourcePath not supported.")))
    }

    override fun fetchStream(request: LynxResourceRequest, delegate: StreamDelegate) {
        delegate.onError("fetchStream not supported.")
    }

    override fun cancel(request: LynxResourceRequest) {}

    companion object {
        const val TAG: String = "DemoGenericResourceFetcher"

        // LynxResourceResponse.onFailed is raw as of Lynx 3.9.0, so its result needs
        // narrowing to the callback's type. A failed response carries only an error and
        // never populates data, so no T instance exists for the cast to trip over.
        private fun <T> onFailed(error: Throwable): LynxResourceResponse<T> =
            LynxResourceResponse.onFailed(error) as LynxResourceResponse<T>
    }
}
