#import "RNSShadowStateProxy.h"
#import "RNSShadowStateUpdating.h"

#import <Lynx/LynxLog.h>
#import <Lynx/LynxShadowNode.h>
#import <Lynx/LynxUIContext.h>

@implementation RNSShadowStateProxy {
    LynxUI *__weak _ui;
    CGRect _previousFrame;
}

- (instancetype)initWithLynxUI:(LynxUI *)ui
{
    if (self = [super init]) {
        _ui = ui;
        [self initState];
    }
    return self;
}

- (void)initState
{
    _previousFrame = CGRectNull;
}

- (void)updateShadowStateWithFrame:(CGRect)frame
{
    if (CGRectEqualToRect(frame, _previousFrame)) {
        return;
    }
    LynxUI *ui = _ui;
    if (ui == nil) {
        return;
    }

    // findShadowNodeAndRunTask hops to the Lynx layout thread and resolves the
    // shadow node by sign - the counterpart of RNS's state->updateState().
    [ui.context findShadowNodeAndRunTask:ui.sign
                                    task:^(LynxShadowNode *node) {
                                        if (![node conformsToProtocol:@protocol(RNSShadowStateUpdating)]) {
                                            LLogWarn(
                                                @"[RNScreens] Shadow node for sign %ld does not support state updates",
                                                (long)ui.sign);
                                            return;
                                        }
                                        [(id<RNSShadowStateUpdating>)node
                                            updateStateWithContentOffsetX:frame.origin.x
                                                           contentOffsetY:frame.origin.y
                                                               frameWidth:frame.size.width
                                                              frameHeight:frame.size.height];
                                    }];
    _previousFrame = frame;
}

- (void)invalidate
{
    [self initState];
}

@end
