ERROR

Welcome to Gradle 7.6!
Here are the highlights of this release:
 - Added support for Java 19.
 - Introduced `--rerun` flag for individual task rerun.
 - Improved dependency block for test suites to be strongly typed.
 - Added a pluggable system for Java toolchains provisioning.
For more details see https://docs.gradle.org/7.6/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. See https://docs.gradle.org/7.6/userguide/gradle_daemon.html#sec:disabling_the_daemon.
Daemon will be stopped at the end of the build
Invalid Java installation found at '/usr/lib/jvm/openjdk-17' (Common Linux Locations). It will be re-checked in the next build. This might have performance impact if it keeps failing. Run the 'javaToolchains' task for more details.
FAILURE: Build failed with an exception.
* What went wrong:
Could not determine the dependencies of null.
> Could not resolve all dependencies for configuration 'classpath'.
   > The new Java toolchain feature cannot be used at the project level in combination with source and/or target compatibility
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
* Get more help at https://help.gradle.org
BUILD FAILED in 40s
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.
