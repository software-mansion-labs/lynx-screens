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

  # Building as a static framework gives the pod its own module, which the
  # modular_headers-based autolinking setup relies on.
  s.static_framework = true

  s.source_files = 'common/**/*.{h,m,mm}', 'header/**/*.{h,m,mm}', 'host/**/*.{h,m,mm}', 'screen/**/*.{h,m,mm}', 'utils/**/*.{h,m,mm}'

  s.dependency 'Lynx'
end
