#import "BaseTransferUI.h"
#import "BaseTransferShadowNode.h"

#import <Lynx/LynxBackgroundManager.h>
#import <Lynx/LynxShadowNode.h>
#import <Lynx/LynxUI+Internal.h>
#import <Lynx/LynxUIContext.h>

@interface BaseTransferUI ()

- (void)syncHostConstraintsFromReceiver:(BaseTransferReceiverView *)receiver;

@end

@implementation BaseTransferReceiverView

- (instancetype)initWithTransfer:(BaseTransferUI *)transfer
{
    if (self = [super initWithFrame:CGRectZero]) {
        _transfer = transfer;
        self.translatesAutoresizingMaskIntoConstraints = YES;
        self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    }
    return self;
}

- (void)layoutSubviews
{
    [super layoutSubviews];
    [self.transfer syncHostConstraintsFromReceiver:self];
}

@end

@implementation BaseTransferUI {
    BaseTransferReceiverView *_transferReceiver;
}

- (BaseTransferReceiverView *)transferReceiver
{
    if (!_transferReceiver) {
        _transferReceiver = [self createTransferReceiver];
    }
    return _transferReceiver;
}

- (BaseTransferReceiverView *)createTransferReceiver
{
    return [[BaseTransferReceiverView alloc] initWithTransfer:self];
}

- (UIView *)childrenContainerView
{
    return self.transferReceiver;
}

- (void)insertChild:(LynxUI *)child atIndex:(NSInteger)index
{
    UIView *containerView = self.transferReceiver;
    CALayer *mainLayer = child.view.layer;
    CALayer *containerLayer = containerView.layer;
    LynxBackgroundManager *backgroundManager = child.backgroundManager;

    // Lynx versions before childrenContainerView support always insert into self.view.
    [self didInsertChild:child atIndex:index];
    [containerView insertSubview:child.view atIndex:index];

    if (index > 0) {
        LynxUI *previousSibling = self.children[index - 1];
        if ([containerLayer.sublayers indexOfObject:previousSibling.topLayer] >
            [containerLayer.sublayers indexOfObject:mainLayer]) {
            [child.view removeFromSuperview];
            [containerView insertSubview:child.view aboveSubview:previousSibling.view];
            [mainLayer removeFromSuperlayer];
            [containerLayer insertSublayer:mainLayer above:previousSibling.topLayer];
        }
    }

    if ((NSUInteger)index < self.children.count - 1) {
        LynxUI *nextSibling = self.children[index + 1];
        if ([containerLayer.sublayers indexOfObject:nextSibling.bottomLayer] <
            [containerLayer.sublayers indexOfObject:mainLayer]) {
            [child.view removeFromSuperview];
            [containerView insertSubview:child.view belowSubview:nextSibling.view];
            [mainLayer removeFromSuperlayer];
            [containerLayer insertSublayer:mainLayer below:nextSibling.bottomLayer];
        }
    }

    if (backgroundManager.borderLayer) {
        [backgroundManager.borderLayer removeFromSuperlayer];
        if (child.overflow == OVERFLOW_HIDDEN_VAL) {
            [containerLayer insertSublayer:backgroundManager.borderLayer above:mainLayer];
        } else {
            [containerLayer insertSublayer:backgroundManager.borderLayer below:mainLayer];
        }
    }

    if (backgroundManager.backgroundLayer) {
        [backgroundManager.backgroundLayer removeFromSuperlayer];
        if (child.overflow != OVERFLOW_HIDDEN_VAL && backgroundManager.borderLayer) {
            [containerLayer insertSublayer:backgroundManager.backgroundLayer
                                     below:backgroundManager.borderLayer];
        } else {
            [containerLayer insertSublayer:backgroundManager.backgroundLayer below:mainLayer];
        }
    }
}

- (void)syncHostConstraintsFromReceiver:(BaseTransferReceiverView *)receiver
{
    BOOL hasExternalHost = receiver.superview && receiver.superview != self.view;
    CGFloat width = CGRectGetWidth(receiver.bounds);
    CGFloat height = CGRectGetHeight(receiver.bounds);
    LynxMeasureMode widthMode = hasExternalHost ? LynxMeasureModeDefinite : LynxMeasureModeIndefinite;
    LynxMeasureMode heightMode = hasExternalHost ? LynxMeasureModeDefinite : LynxMeasureModeIndefinite;
    [self.context findShadowNodeAndRunTask:self.sign
                                     task:^(LynxShadowNode *node) {
                                         if ([node isKindOfClass:BaseTransferShadowNode.class]) {
                                             [(BaseTransferShadowNode *)node
                                                 updateHostConstraintsWithWidth:width
                                                                      widthMode:widthMode
                                                                         height:height
                                                                     heightMode:heightMode];
                                         }
                                     }];
}

@end
