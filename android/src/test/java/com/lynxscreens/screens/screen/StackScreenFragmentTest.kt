package com.lynxscreens.screens.screen

import androidx.fragment.app.FragmentFactory
import java.lang.reflect.Modifier
import org.junit.Assert.assertTrue
import org.junit.Test

class StackScreenFragmentTest {
    @Test
    fun defaultFragmentFactoryCreatesRestoredPlaceholder() {
        val fragment =
            FragmentFactory().instantiate(
                checkNotNull(StackScreenFragment::class.java.classLoader),
                StackScreenFragment::class.java.name,
            )

        assertTrue(fragment is StackScreenFragment)
        assertTrue((fragment as StackScreenFragment).isRestoredPlaceholder)
    }

    @Test
    fun noArgumentConstructorIsPublic() {
        val constructor = StackScreenFragment::class.java.getConstructor()

        assertTrue(Modifier.isPublic(constructor.modifiers))
    }
}
