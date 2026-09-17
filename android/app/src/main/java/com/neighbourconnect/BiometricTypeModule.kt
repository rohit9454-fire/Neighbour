package com.neighbourconnect

import android.content.pm.PackageManager
import android.hardware.biometrics.BiometricManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableNativeMap

class BiometricTypeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "BiometricTypeModule"

    @ReactMethod
    fun getEnrolledBiometrics(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val result = WritableNativeMap()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val bm = reactContext.getSystemService(BiometricManager::class.java)

                // BIOMETRIC_WEAK covers both Class 2 (most OEM face) and Class 3 (fingerprint)
                val weakAvailable = bm?.canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_WEAK
                ) == BiometricManager.BIOMETRIC_SUCCESS

                if (!weakAvailable) {
                    result.putBoolean("hasFingerprint", false)
                    result.putBoolean("hasFace", false)
                    promise.resolve(result)
                    return
                }

                val hasFingerHardware = pm.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
                val hasFaceHardware = pm.hasSystemFeature(PackageManager.FEATURE_FACE) ||
                    pm.hasSystemFeature(PackageManager.FEATURE_IRIS)

                // Check strong (Class 3) — fingerprint is almost always strong
                val strongAvailable = bm.canAuthenticate(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG
                ) == BiometricManager.BIOMETRIC_SUCCESS

                // If strong is available and device has fingerprint hardware → fingerprint enrolled
                val hasFingerprint = hasFingerHardware && strongAvailable
                // Face is enrolled if face hardware exists and weak auth passes
                // (face is typically Class 2 on most Android OEMs)
                val hasFace = hasFaceHardware && weakAvailable

                result.putBoolean("hasFingerprint", hasFingerprint)
                result.putBoolean("hasFace", hasFace)
            } else {
                // Pre-Q: only fingerprint supported
                val hasFingerprint = pm.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)
                result.putBoolean("hasFingerprint", hasFingerprint)
                result.putBoolean("hasFace", false)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("BiometricTypeError", e.message)
        }
    }
}
