plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.kapt")
}

android {
    namespace = "com.lynxscreens"
    compileSdk = 36

    defaultConfig {
        minSdk = 24
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    implementation("org.lynxsdk.lynx:lynx:4.0.1")
    implementation("org.lynxsdk.lynx:service-api:4.0.1")
    kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")

    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    implementation("androidx.fragment:fragment-ktx:1.8.9")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.transition:transition-ktx:1.7.0")
    implementation("com.google.android.material:material:1.13.0")
    implementation("androidx.core:core-ktx:1.17.0")
}
