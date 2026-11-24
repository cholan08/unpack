import type { ToolTopics } from './types';

export const MOBILE: ToolTopics = {
  'react-native': [
    { title: 'Getting Started', topics: ['What is React Native', 'Expo vs bare CLI', 'Creating an Expo app', 'Expo Go', 'Project structure'] },
    { title: 'Core Components', topics: ['View', 'Text', 'Image', 'ScrollView', 'TextInput', 'Pressable', 'Button', 'Modal', 'SafeAreaView'] },
    { title: 'Styling & Layout', topics: ['StyleSheet', 'Flexbox in RN', 'Dimensions', 'Platform-specific styles', 'Dark mode', 'NativeWind'] },
    { title: 'Lists', topics: ['FlatList', 'SectionList', 'Pull to refresh', 'Infinite scroll'] },
    { title: 'Navigation', topics: ['Expo Router', 'React Navigation', 'Stack navigator', 'Tab navigator', 'Drawer navigator', 'Deep linking'] },
    { title: 'Data & State', topics: ['Fetching data', 'TanStack Query', 'Zustand', 'AsyncStorage', 'SQLite', 'Secure storage'] },
    { title: 'Device Features', topics: ['Camera', 'Location', 'Push notifications', 'Permissions', 'Haptics', 'File system'] },
    { title: 'Animations', topics: ['Animated API', 'Reanimated', 'Gesture Handler', 'Layout animations'] },
    { title: 'Advanced', topics: ['Native modules', 'New Architecture', 'Performance', 'Debugging'] },
    { title: 'Shipping', topics: ['Testing', 'EAS Build', 'EAS Submit', 'OTA updates', 'App store guidelines'] },
  ],

  flutter: [
    { title: 'Dart Basics', topics: ['Variables & types', 'Null safety', 'Functions', 'Classes', 'Collections', 'async & Future', 'Streams'] },
    { title: 'Getting Started', topics: ['What is Flutter', 'Installing Flutter', 'flutter create', 'Hot reload', 'Project structure'] },
    { title: 'Widgets', topics: ['Everything is a widget', 'StatelessWidget', 'StatefulWidget', 'Text & Image', 'Buttons', 'Icons', 'Material & Cupertino'] },
    { title: 'Layout', topics: ['Row & Column', 'Container', 'Stack', 'Expanded & Flexible', 'Padding & SizedBox', 'ListView', 'GridView', 'Responsive layouts'] },
    { title: 'Navigation', topics: ['Navigator', 'Named routes', 'go_router', 'Passing data'] },
    { title: 'Forms & Input', topics: ['TextField', 'Form & validation', 'Gestures'] },
    { title: 'State Management', topics: ['setState', 'InheritedWidget', 'Provider', 'Riverpod', 'Bloc'] },
    { title: 'Data', topics: ['HTTP & JSON', 'Serialization', 'SharedPreferences', 'SQLite / Drift', 'Firebase'] },
    { title: 'Advanced', topics: ['Animations', 'Custom painting', 'Platform channels', 'Theming'] },
    { title: 'Shipping', topics: ['Widget tests', 'Integration tests', 'Performance', 'Publishing to stores'] },
  ],

  ionic: [
    { title: 'Getting Started', topics: ['What is Ionic', 'Ionic CLI', 'Choosing Angular, React or Vue', 'Project structure'] },
    { title: 'UI Components', topics: ['Layout & grid', 'Buttons', 'Lists', 'Cards', 'Forms & inputs', 'Modals', 'Toasts & alerts', 'Tabs', 'Menus'] },
    { title: 'Navigation & Theming', topics: ['Routing', 'Navigation stacks', 'Theming with CSS variables', 'Dark mode', 'Platform styles'] },
    { title: 'Capacitor', topics: ['What is Capacitor', 'Camera', 'Geolocation', 'Storage', 'Push notifications', 'Plugins'] },
    { title: 'Shipping', topics: ['Building for Android', 'Building for iOS', 'PWA support', 'Live updates', 'Publishing'] },
  ],

  maui: [
    { title: 'Getting Started', topics: ['What is .NET MAUI', 'Installing workloads', 'Project structure', 'Single project'] },
    { title: 'UI', topics: ['XAML basics', 'Controls', 'Layouts', 'Pages', 'Styles & resources', 'Images & fonts'] },
    { title: 'Architecture', topics: ['Data binding', 'MVVM', 'CommunityToolkit.Mvvm', 'Dependency injection'] },
    { title: 'Navigation', topics: ['Shell navigation', 'Routes', 'Passing parameters'] },
    { title: 'Data & Device', topics: ['HTTP calls', 'SQLite', 'Preferences', 'Device APIs', 'Platform-specific code'] },
    { title: 'Shipping', topics: ['Unit testing', 'Blazor Hybrid', 'Packaging', 'Publishing'] },
  ],

  pwa: [
    { title: 'Getting Started', topics: ['What is a PWA', 'PWA vs native', 'HTTPS requirement', 'Installability criteria'] },
    { title: 'Web App Manifest', topics: ['manifest.json', 'Icons', 'display modes', 'Theme colour', 'Shortcuts', 'Install prompt'] },
    { title: 'Service Workers', topics: ['What a service worker is', 'Registering', 'Lifecycle', 'Fetch events', 'Updating service workers'] },
    { title: 'Caching & Offline', topics: ['Cache API', 'Cache first', 'Network first', 'Stale-while-revalidate', 'Offline fallback page', 'Workbox'] },
    { title: 'Capabilities', topics: ['Push notifications', 'Background sync', 'IndexedDB', 'Web Share', 'Badging'] },
    { title: 'Shipping', topics: ['Lighthouse audit', 'vite-plugin-pwa', 'Publishing to app stores', 'App-like UX'] },
  ],

  kotlin: [
    { title: 'Getting Started', topics: ['What is Kotlin', 'Installing & IntelliJ', 'Hello World', 'Kotlin playground'] },
    { title: 'Basics', topics: ['val vs var', 'Basic types', 'Strings & templates', 'Null safety', 'Safe calls & elvis', 'Control flow', 'when expression', 'Ranges & loops'] },
    { title: 'Functions', topics: ['Functions', 'Default & named args', 'Lambdas', 'Higher-order functions', 'Extension functions', 'Scope functions', 'Inline functions'] },
    { title: 'Classes', topics: ['Classes & constructors', 'Data classes', 'Inheritance', 'Interfaces', 'Sealed classes', 'Enums', 'Objects & companions'] },
    { title: 'Collections', topics: ['List, Set, Map', 'Mutable vs immutable', 'Collection operations', 'Sequences'] },
    { title: 'Advanced', topics: ['Generics', 'Delegation', 'Coroutines', 'Flow', 'Exceptions'] },
    { title: 'Ecosystem', topics: ['Gradle Kotlin DSL', 'Android development', 'Ktor', 'Kotlin Multiplatform', 'Testing'] },
  ],

  'android-sdk': [
    { title: 'Getting Started', topics: ['Android Studio', 'Emulators', 'Project structure', 'Gradle', 'AndroidManifest'] },
    { title: 'App Components', topics: ['Activities', 'Lifecycle', 'Intents', 'Services', 'Broadcast receivers', 'Content providers'] },
    { title: 'Jetpack Compose', topics: ['Composables', 'Modifiers', 'Layouts', 'State in Compose', 'Lists (LazyColumn)', 'Material 3', 'Theming'] },
    { title: 'Architecture', topics: ['ViewModel', 'Navigation', 'Repository pattern', 'Hilt', 'Clean architecture'] },
    { title: 'Data', topics: ['Room database', 'DataStore', 'Retrofit', 'Kotlin coroutines', 'Flow'] },
    { title: 'Device & Background', topics: ['Permissions', 'Camera', 'Location', 'Notifications', 'WorkManager'] },
    { title: 'Shipping', topics: ['Unit tests', 'UI tests', 'Performance', 'Signing', 'Play Store publishing'] },
  ],

  swift: [
    { title: 'Getting Started', topics: ['What is Swift', 'Xcode', 'Playgrounds', 'Hello World'] },
    { title: 'Basics', topics: ['let vs var', 'Types', 'Strings', 'Optionals', 'Optional binding', 'Control flow', 'switch', 'Collections'] },
    { title: 'Functions & Closures', topics: ['Functions', 'Argument labels', 'Closures', 'Higher-order functions'] },
    { title: 'Types', topics: ['Structs', 'Classes', 'Structs vs classes', 'Enums', 'Protocols', 'Extensions', 'Generics'] },
    { title: 'Errors & Memory', topics: ['Error handling', 'ARC', 'Strong & weak references', 'Retain cycles'] },
    { title: 'Concurrency', topics: ['async / await', 'Tasks', 'Actors', 'MainActor'] },
    { title: 'SwiftUI', topics: ['Views', 'Modifiers', 'Stacks & layout', 'State & Binding', 'Observable', 'Lists', 'NavigationStack', 'Forms', 'Animations'] },
    { title: 'Data', topics: ['URLSession', 'Codable', 'SwiftData', 'UserDefaults'] },
    { title: 'Shipping', topics: ['Swift Package Manager', 'Testing', 'App Store submission'] },
  ],

  'objective-c': [
    { title: 'Getting Started', topics: ['What is Objective-C', 'C foundations', 'Xcode project', 'Header & implementation files'] },
    { title: 'Basics', topics: ['Message syntax', 'Classes', 'Methods', 'Properties', 'NSString', 'NSArray & NSDictionary'] },
    { title: 'Language Features', topics: ['Protocols', 'Categories', 'Extensions', 'Blocks', 'Selectors'] },
    { title: 'Memory & Runtime', topics: ['ARC', 'Retain cycles', 'The runtime', 'Method swizzling'] },
    { title: 'Frameworks', topics: ['Foundation', 'UIKit', 'Grand Central Dispatch', 'Delegation pattern'] },
    { title: 'Interop', topics: ['Bridging headers', 'Calling Swift from ObjC', 'Migrating to Swift'] },
  ],

  xcode: [
    { title: 'Getting Started', topics: ['Installing Xcode', 'Creating a project', 'The interface', 'Navigators & inspectors'] },
    { title: 'Building', topics: ['Targets', 'Schemes', 'Build settings', 'Simulators', 'Running on a device'] },
    { title: 'UI Tools', topics: ['SwiftUI previews', 'Interface Builder', 'Asset catalogs'] },
    { title: 'Debugging', topics: ['Breakpoints', 'LLDB console', 'View debugger', 'Memory graph'] },
    { title: 'Testing & Profiling', topics: ['XCTest', 'Swift Testing', 'UI tests', 'Instruments', 'Time Profiler', 'Leaks'] },
    { title: 'Shipping', topics: ['Signing & provisioning', 'Archiving', 'TestFlight', 'App Store Connect', 'Xcode Cloud'] },
  ],
};
