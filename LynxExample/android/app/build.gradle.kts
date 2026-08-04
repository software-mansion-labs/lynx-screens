plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)

    id("kotlin-kapt")
    id("org.lynxsdk.lynx.library-build")
}

android {
    namespace = "com.lynxscreens"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.lynxscreens"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    signingConfigs {
        create("release") {
            storeFile = file("release-key.keystore")
            storePassword = "release"
            keyAlias = "release-key-alias"
            keyPassword = "release-key-password"
        }
    }

    buildTypes {
        debug {
            isDebuggable = true
            applicationIdSuffix = ".debug"
        }
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)

    implementation("com.squareup.retrofit2:retrofit:2.7.0")

    // lynx dependencies
    implementation("org.lynxsdk.lynx:lynx:4.0.1")
    implementation("org.lynxsdk.lynx:lynx-jssdk:4.0.1")
    implementation("org.lynxsdk.lynx:lynx-trace:4.0.1")
    // primjs 4.0.1 is not published to Maven Central (latest stable is 4.0.0),
    // but lynx:4.0.1 transitively requires it - force 4.0.0 until upstream publishes 4.0.1
    implementation("org.lynxsdk.lynx:primjs") {
        version { strictly("4.0.0") }
    }

    // integrating image-service
    implementation("org.lynxsdk.lynx:lynx-service-image:4.0.1")

    // image-service dependencies, if not added, images cannot be loaded; if the host APP needs to use other image libraries, you can customize the image-service and remove this dependency
    implementation("com.facebook.fresco:fresco:2.3.0")
    implementation("com.facebook.fresco:animated-gif:2.3.0")
    implementation("com.facebook.fresco:animated-webp:2.3.0")
    implementation("com.facebook.fresco:webpsupport:2.3.0")
    implementation("com.facebook.fresco:animated-base:2.3.0")

    // integrating log-service
    implementation("org.lynxsdk.lynx:lynx-service-log:4.0.1")

    // integrating http-service
    implementation("org.lynxsdk.lynx:lynx-service-http:4.0.1")

    implementation("com.squareup.okhttp3:okhttp:4.9.0")

    // add devtool's dependencies
    implementation ("org.lynxsdk.lynx:lynx-devtool:4.0.1")
    implementation ("org.lynxsdk.lynx:lynx-service-devtool:4.0.1")

    // add xelement's dependencies
    implementation ("org.lynxsdk.lynx:xelement:4.0.1")
    implementation ("org.lynxsdk.lynx:xelement-input:4.0.1")

    implementation("androidx.appcompat:appcompat:1.7.1")

    kapt("org.lynxsdk.lynx:lynx-processor:4.0.1")
    compileOnly("org.lynxsdk.lynx:lynx-processor:4.0.1")
    annotationProcessor("org.lynxsdk.lynx:lynx-processor:4.0.1")
}