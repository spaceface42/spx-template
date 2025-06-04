# system

This `system` folder contains the core building blocks and utilities for the project. It is organized into three main areas:

- **sbin/**: Contains low-level, generic utility classes and functions (such as debounce, clamp, device detection, and DOM readiness). These are reusable helpers not tied to any specific feature.
- **bin/**: Contains higher-level, system-wide managers and services (such as ResizeManager, PerformanceMonitor, AsyncImageLoader, and InactivityWatcher). These classes provide infrastructure and coordination for features and the app as a whole.
- **features/**: Contains modular, self-contained feature implementations (such as FloatingImages, ContentRevealer, AudioPlayer, etc.). Each feature folder groups all code related to a specific user-facing or app-facing capability.

This structure keeps generic utilities, system services, and application features clearly separated and easy to maintain.