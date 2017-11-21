"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const shelljs_1 = require("shelljs");
const common_1 = require("../utils/common");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const plugin_1 = require("../utils/plugin");
const readFileAsync = util_1.promisify(fs_1.readFile);
const writeFileAsync = util_1.promisify(fs_1.writeFile);
const readdirAsync = util_1.promisify(fs_1.readdir);
const APP_FOLDER = 'AvocadoApp';
function createXcodeProject(path) {
    const base = `/Users/manuelmartinez-almeida/repos/ionic/avocado/packages/cli/assets/xcode-base/AvocadoApp`;
    shelljs_1.exec(`rm -rf ${APP_FOLDER}`);
    shelljs_1.exec(`cp -a ${base} ${APP_FOLDER}`);
}
exports.createXcodeProject = createXcodeProject;
function checkEnvironment() {
    if (!common_1.isInstalled('pod')) {
        throw 'cocoapods is not installed. For information: https://guides.cocoapods.org/using/getting-started.html#installation';
    }
}
exports.checkEnvironment = checkEnvironment;
function install() {
    return __awaiter(this, void 0, void 0, function* () {
        checkEnvironment();
        createXcodeProject('');
        const plugins = yield plugin_1.getPlugins();
        const iOSPlugins = yield getIOSPlugins(plugins);
        autoGeneratePods(iOSPlugins);
        installCocoaPodsPlugins(iOSPlugins);
    });
}
exports.install = install;
function autoGeneratePods(plugins) {
    return __awaiter(this, void 0, void 0, function* () {
        plugins
            .filter(p => p.ios.type === 0 /* Code */)
            .map((p) => __awaiter(this, void 0, void 0, function* () {
            const name = p.ios.name = p.name;
            p.ios.type = 1 /* Cocoapods */;
            const content = generatePodspec(name);
            const path = path_1.join(p.ios.path, name + '.podspec');
            yield writeFileAsync(path, content);
        }));
    });
}
exports.autoGeneratePods = autoGeneratePods;
function generatePodspec(name) {
    return `
  Pod::Spec.new do |s|
    s.name = '${name}'
    s.version = '0.0.1'
    s.summary = 'Autogenerated spec'
    s.license = 'Unknown'
    s.homepage = 'https://example.com'
    s.authors = { 'Avocado generator' => 'hi@ionicframework.com' }
    s.source = { :git => 'https://github.com/ionic-team/avocado.git', :tag => '0.0.1' }
    s.source_files = '*.{swift,h,m}'
  end`;
}
exports.generatePodspec = generatePodspec;
function installCocoaPodsPlugins(plugins) {
    return __awaiter(this, void 0, void 0, function* () {
        const pods = plugins
            .filter(p => p.ios.type === 1 /* Cocoapods */);
        updatePodfile(pods);
    });
}
exports.installCocoaPodsPlugins = installCocoaPodsPlugins;
function updatePodfile(plugins) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = generatePodFile(plugins);
        yield writeFileAsync(path_1.join(APP_FOLDER, 'Podfile'), content, 'utf8');
        shelljs_1.exec(`cd ${APP_FOLDER} && pod update`);
    });
}
exports.updatePodfile = updatePodfile;
function generatePodFile(plugins) {
    return `
    platform :ios, '9.0'
    project 'AvocadoApp.xcodeproj'
    use_frameworks!

    target 'AvocadoApp' do
      ${plugins
        .map((p) => `pod '${p.ios.name}', :path => '${p.ios.path}'`)
        .join('\n')}
    end`;
}
exports.generatePodFile = generatePodFile;
function getIOSPlugins(allPlugins) {
    return __awaiter(this, void 0, void 0, function* () {
        const resolved = yield Promise.all(allPlugins.map(resolvePluginIos));
        return resolved.filter(plugin => !!plugin.ios);
    });
}
exports.getIOSPlugins = getIOSPlugins;
function resolvePluginIos(plugin) {
    return __awaiter(this, void 0, void 0, function* () {
        if (plugin.ios) {
            return plugin;
        }
        const iosPath = path_1.join(plugin.rootPath, plugin.meta.ios || 'native/ios');
        console.log(iosPath);
        try {
            const files = yield readdirAsync(iosPath);
            plugin.ios = {
                name: 'Plugin',
                type: 0 /* Code */,
                path: iosPath
            };
            const podSpec = files.find(file => file.endsWith('.podspec'));
            if (podSpec) {
                plugin.ios.type = 1 /* Cocoapods */;
                plugin.ios.name = podSpec.split('.')[0];
            }
        }
        catch (e) {
        }
        return plugin;
    });
}
exports.resolvePluginIos = resolvePluginIos;
function checkCocoaPods() {
}
function readJSON(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield readFileAsync(path, 'utf8');
        return JSON.parse(data);
    });
}
exports.readJSON = readJSON;