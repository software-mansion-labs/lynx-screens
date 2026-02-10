package com.lynxscreens.screens.screen

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.lynxscreens.screens.host.StackContainer
import java.lang.ref.WeakReference

internal class StackScreenFragment(
    internal val stackContainer: WeakReference<StackContainer>,
    internal val stackScreen: StackScreenComponent,
) : Fragment() {
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?,
    ): View = stackScreen.view

    override fun onStart() {
        stackScreen.notifyOnWillAppear()
        super.onStart()
    }

    override fun onResume() {
        stackScreen.notifyOnDidAppear()
        super.onResume()
    }

    override fun onPause() {
        stackScreen.notifyOnWillDisappear()
        super.onPause()
    }

    override fun onStop() {
        stackScreen.notifyOnDidDisappear()
        super.onStop()
    }

    override fun onDestroyView() {
        stackContainer.get()?.onFragmentDestroyView(this)
        stackScreen.notifyOnDismiss(stackScreen.activityMode == StackScreenComponent.ActivityMode.ATTACHED)
        super.onDestroyView()
    }
}
