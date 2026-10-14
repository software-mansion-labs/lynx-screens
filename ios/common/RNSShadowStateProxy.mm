#import "RNSShadowStateProxy.h"
#import "RNSShadowStateUpdating.h"

#import <Lynx/LynxLog.h>
#import <Lynx/LynxShadowNode.h>
#import <Lynx/LynxUIContext.h>
#import <Lynx/LynxView+Internal.h>

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

- (void)updateShadowStateImmediatelyWithFrame:(CGRect)frame
{
    if (CGRectEqualToRect(frame, _previousFrame)) {
        return;
    }
    LynxUI *ui = _ui;
    if (ui == nil) {
        return;
    }
    [self updateShadowStateWithFrame:frame];

    // Same call LynxView makes from its own layoutSubviews: runs the layout
    // block if a layout was requested, no-op otherwise.
    UIView *rootView = ui.context.rootView;
    if ([rootView isKindOfClass:LynxView.class]) {
        [((LynxView *)rootView).templateRender triggerLayoutInTick];
    }
}

- (void)invalidate
{
    [self initState];
}

@end
