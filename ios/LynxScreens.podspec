require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name = 'LynxScreens'
  s.version = package['version']
  s.summary = package['description']
  s.homepage = 'https://github.com/software-mansion-labs/lynx-screens'
  s.license = package['license']
  s.author = 'Software Mansion'
  s.source = { :path => '..' }

  s.ios.deployment_target = '10.0'
  s.swift_version = '5.0'

  # The pod mixes Objective-C++ and Swift. Building it as a static framework
  # gives it a module, which is required for the Swift sources to see the pod's
  # own Objective-C classes (no bridging headers in pods) - and for the
  # generated LynxScreens-Swift.h header the .mm files import.
  s.static_framework = true

  s.source_files = 'host/**/*.{h,m,mm,swift}', 'screen/**/*.{h,m,mm,swift}'

  s.dependency 'Lynx'
end
