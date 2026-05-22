#import <Cocoa/Cocoa.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#import <WebKit/WebKit.h>

@interface AppDelegate : NSObject <NSApplicationDelegate, WKScriptMessageHandler>
@property(nonatomic, strong) NSWindow *window;
@property(nonatomic, strong) WKWebView *webView;
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification {
  WKUserContentController *controller = [[WKUserContentController alloc] init];
  [controller addScriptMessageHandler:self name:@"savePNG"];
  [controller addScriptMessageHandler:self name:@"copyCSS"];

  WKWebViewConfiguration *configuration = [[WKWebViewConfiguration alloc] init];
  configuration.userContentController = controller;

  self.webView = [[WKWebView alloc] initWithFrame:NSZeroRect configuration:configuration];
  [self.webView setValue:@NO forKey:@"drawsBackground"];

  NSRect frame = NSMakeRect(0, 0, 1280, 760);
  self.window = [[NSWindow alloc]
      initWithContentRect:frame
                styleMask:NSWindowStyleMaskTitled | NSWindowStyleMaskClosable |
                          NSWindowStyleMaskMiniaturizable | NSWindowStyleMaskResizable
                  backing:NSBackingStoreBuffered
                    defer:NO];
  self.window.title = @"弥散渐变生成器";
  self.window.minSize = NSMakeSize(980, 640);
  self.window.contentView = self.webView;
  [self.window center];
  [self.window makeKeyAndOrderFront:nil];

  [NSApp activateIgnoringOtherApps:YES];
  [self loadLocalApp];
}

- (BOOL)applicationShouldTerminateAfterLastWindowClosed:(NSApplication *)sender {
  return YES;
}

- (void)userContentController:(WKUserContentController *)userContentController
      didReceiveScriptMessage:(WKScriptMessage *)message {
  if ([message.name isEqualToString:@"copyCSS"] && [message.body isKindOfClass:[NSString class]]) {
    NSPasteboard *pasteboard = [NSPasteboard generalPasteboard];
    [pasteboard clearContents];
    [pasteboard setString:(NSString *)message.body forType:NSPasteboardTypeString];
    return;
  }

  if ([message.name isEqualToString:@"savePNG"]) {
    [self savePNG:message.body];
  }
}

- (void)loadLocalApp {
  NSURL *url = [[NSBundle mainBundle] URLForResource:@"index" withExtension:@"html" subdirectory:@"www"];
  if (!url) {
    [self showError:@"找不到应用资源。"];
    return;
  }

  [self.webView loadFileURL:url allowingReadAccessToURL:[url URLByDeletingLastPathComponent]];
}

- (void)savePNG:(id)body {
  if (![body isKindOfClass:[NSDictionary class]]) {
    [self showError:@"PNG 数据无效。"];
    return;
  }

  NSDictionary *payload = (NSDictionary *)body;
  NSString *filename = payload[@"filename"];
  NSString *dataUrl = payload[@"dataUrl"];
  if (![filename isKindOfClass:[NSString class]] || ![dataUrl isKindOfClass:[NSString class]]) {
    [self showError:@"PNG 数据无效。"];
    return;
  }

  NSRange commaRange = [dataUrl rangeOfString:@","];
  if (commaRange.location == NSNotFound) {
    [self showError:@"PNG 数据无效。"];
    return;
  }

  NSString *base64 = [dataUrl substringFromIndex:commaRange.location + 1];
  NSData *data = [[NSData alloc] initWithBase64EncodedString:base64 options:0];
  if (!data) {
    [self showError:@"PNG 数据无效。"];
    return;
  }

  NSSavePanel *panel = [NSSavePanel savePanel];
  panel.title = @"保存渐变 PNG";
  panel.nameFieldStringValue = filename;
  panel.allowedContentTypes = @[[UTType typeWithFilenameExtension:@"png"]];
  panel.canCreateDirectories = YES;

  [panel beginSheetModalForWindow:self.window
                completionHandler:^(NSModalResponse result) {
                  if (result != NSModalResponseOK || !panel.URL) {
                    return;
                  }

                  NSError *error = nil;
                  BOOL ok = [data writeToURL:panel.URL options:NSDataWritingAtomic error:&error];
                  if (!ok) {
                    [self showError:[NSString stringWithFormat:@"保存失败：%@", error.localizedDescription]];
                  }
                }];
}

- (void)showError:(NSString *)message {
  NSAlert *alert = [[NSAlert alloc] init];
  alert.messageText = message;
  alert.alertStyle = NSAlertStyleWarning;
  [alert runModal];
}

@end

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    NSApplication *app = [NSApplication sharedApplication];
    AppDelegate *delegate = [[AppDelegate alloc] init];
    app.delegate = delegate;
    [app run];
  }
  return 0;
}
