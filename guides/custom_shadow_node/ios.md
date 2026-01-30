# Shadow Nodes in Lynx - guide for iOS

This guide will walk through step-by-step process of creating a Custom Shadow Node associated with Custom Native Element in Lynx system. It covers

- Creating a Custom Shadow Node
- Registering the Custom Shadow Node
- Implementing custom logic for updating component size and children positioning
- Passing information between the Native Element and the Shadow Node instance via properties

---

## Project Structure

We're relying on 3 classes

- **LynxColorBoxView** - A custom native view which extends `UIView`
- **LynxColorBoxComponent** - The Component is a wrapper over a view which is responsible for creating the view, mapping properties passed from the JS layer to the native component and handling interaction between the Shadow Node and the native component.
- **LynxColorBoxShadowNode** - A Custom Shadow Node with dedicated logic for view resizing and children offsets.

---

## Creating a Custom Shadow Node step-by-step

### Step 1 - Define the ShadowNode class

Create a Shadow Node class that inherits from `LynxShadowNode` and implements the `LynxCustomMeasureDelegate` protocol (required for implementing custom methods for correcting the measurement and alignment).

- **LynxColorBoxShadowNode.h**

```objective-c
#import <Lynx/LynxCustomMeasureDelegate.h>
#import <Lynx/LynxShadowNode.h>

NS_ASSUME_NONNULL_BEGIN

@interface LynxColorBoxShadowNode :  LynxShadowNode <LynxCustomMeasureDelegate>

@property (atomic, assign) CGSize uiSize;

@end

NS_ASSUME_NONNULL_END
```

### Step 2 - Implement the Custom Shadow Node logic

- **LynxColorBoxShadowNode.m**

### Step 2.1 - Use the macro to register the Custom Shadow Node and link it with the Custom Native Element of the same type.

```objective-c
#import "LynxColorBoxShadowNode.h"
#import <Lynx/LynxComponentRegistry.h>

@implementation LynxColorBoxShadowNode

// Registers this custom ShadowNode implementation for the "color-box-view" component
LYNX_LAZY_REGISTER_SHADOW_NODE("color-box-view")

@end
```

### Step 2.2 – Add the initialization method

```objective-c
- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName {
    if (self = [super initWithSign:sign tagName:tagName]) {
        // NO-OP
    }
    return self;
}
```

### Step 2.3 – Override `adoptNativeLayoutNode` to register the custom delegate

```objective-c
// Called when `LayoutContextDarwin::CreateLayoutNode` instantiates this component.
// At this point, the view hierarchy and frame are not yet defined.
// This method is typically used to set up callbacks or interfaces,
// such as assigning a `LynxCustomMeasureDelegate`, which enables
// communication of size or content offset information back to `Starlight` layout engine.
- (void)adoptNativeLayoutNode:(int64_t)ptr{
    [self setCustomMeasureDelegate:self];
    [super adoptNativeLayoutNode:ptr];
}
```

### Step 2.4 – Implement `measureWithMeasureParam:param:context` to send component size updates.

```objective-c
#import <Lynx/LynxNativeLayoutNode.h>
...
// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
// Since we define a custom measurement method, we take full control over
// sizing for the entire layout subtree. This method calculates and returns
// the size of the native view and recursively measures child nodes.
- (MeasureResult)measureWithMeasureParam:(nonnull MeasureParam *)param MeasureContext:(nullable MeasureContext *)context {
    MeasureResult result;
    result.size = CGSizeMake(ceil(self.uiSize.width), ceil(self.uiSize.height));
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child measureWithMeasureParam:param MeasureContext:context];
    
    return result;
}
```

### Step 2.5 – Implement `alignWithAlignParam:param:context` to update children positioning (offsets)

```objective-c
// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
// By defining a custom alignment method, we take control over positioning
// for the current subtree. Here, we offset the content by a fixed amount.
- (void)alignWithAlignParam:(nonnull AlignParam *)param AlignContext:(nonnull AlignContext *)context {
    CGFloat leftOffset = 100;
    CGFloat topOffset = 100;
    
    [param SetAlignOffsetWithLeft:leftOffset Top:topOffset];
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child alignWithAlignParam:param AlignContext:context];
}
```

### Result

As a result, we should end up with the following implementation for Custom Shadow Node

```objective-c
#import "LynxColorBoxShadowNode.h"
#import <Lynx/LynxComponentRegistry.h>
#import <Lynx/LynxNativeLayoutNode.h>

@implementation LynxColorBoxShadowNode

// Registers this custom ShadowNode implementation for the "color-box-view" component
LYNX_LAZY_REGISTER_SHADOW_NODE("color-box-view")

- (instancetype)initWithSign:(NSInteger)sign tagName:(NSString *)tagName {
    if (self = [super initWithSign:sign tagName:tagName]) {
        // NO-OP
    }
    return self;
}

// Called when `LayoutContextDarwin::CreateLayoutNode` instantiates this component.
// At this point, the view hierarchy and frame are not yet defined.
// This method is typically used to set up callbacks or interfaces,
// such as assigning a `LynxCustomMeasureDelegate`, which enables
// communication of size or content offset information back to `Starlight` layout engine.
- (void)adoptNativeLayoutNode:(int64_t)ptr{
    [self setCustomMeasureDelegate:self];
    [super adoptNativeLayoutNode:ptr];
}

// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
// Since we define a custom measurement method, we take full control over
// sizing for the entire layout subtree. This method calculates and returns
// the size of the native view and recursively measures child nodes.
- (MeasureResult)measureWithMeasureParam:(nonnull MeasureParam *)param MeasureContext:(nullable MeasureContext *)context {
    MeasureResult result;
    result.size = CGSizeMake(ceil(self.uiSize.width), ceil(self.uiSize.height));
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child measureWithMeasureParam:param MeasureContext:context];
    
    return result;
}

// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
// By defining a custom alignment method, we take control over positioning
// for the current subtree. Here, we offset the content by a fixed amount.
- (void)alignWithAlignParam:(nonnull AlignParam *)param AlignContext:(nonnull AlignContext *)context {
    CGFloat leftOffset = 100;
    CGFloat topOffset = 100;
    
    [param SetAlignOffsetWithLeft:leftOffset Top:topOffset];
    
    LynxNativeLayoutNode *child = (LynxNativeLayoutNode *)self.children.firstObject;
    [child alignWithAlignParam:param AlignContext:context];
}

@end
```

### Step 3 – Implement the communication between ShadowNode and Component

We link our ShadowNode with the actual view. At this point, based on the read view parameters (e.g., frame), we can introduce our layout corrections and request the engine to update.

```objective-c
...
#import "LynxColorBoxShadowNode.h"
...
#import <Lynx/LynxShadowNodeOwner.h>
...
@implementation LynxColorBoxComponent
...
// Note: This doesn't seem to be good place to apply updates, but
// it's sufficient for basic testing and demonstration purposes.
- (void)layoutDidFinished {
    // Retrieve the corresponding ShadowNode from the Lynx context by node sign (unique ID)
    LynxColorBoxShadowNode *node = (LynxColorBoxShadowNode*)[self.context.nodeOwner nodeWithSign:self.sign];
    // Ensure that the retrieved node is an instance of our custom ShadowNode class
    if ([node isKindOfClass:LynxColorBoxShadowNode.class]) {
        // Store the previously set size
        CGSize preSize = node.uiSize;
        
        // Perform some calculations for updating the size
        CGSize updatedSize = [self adjustViewSize];
        
        // If the size has changed, update the ShadowNode and request a re-layout
        if (!CGSizeEqualToSize(preSize, updatedSize)) {
            node.uiSize = updatedSize;
            [node setNeedsLayout];
        }
    }
}

// Returns a hardcoded width and height for testing purposes
- (CGSize)adjustViewSize {
    return CGSizeMake(300, 300);
}
...
```

### Step 4 - Adding the Custom Native Element to the JS Application

To see it in action, use the following snippet, which demonstrates how we can set the size for `color-box-view` and the offset for its child from the native side.

```jsx
import { useState } from '@lynx-js/react';
import * as Lynx from '@lynx-js/types';

import './App.css';

export function App(props: { onRender?: () => void }) {
  const [color, _] = useState('#45ac1f');

  return (
    <page>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: 2,
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: 100,
            width: 100,
          }}
        />
      </color-box-view>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: 2,
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: 100,
            width: 100,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <view
            style={{
              backgroundColor: '#1364f0',
              display: 'flex',
              height: 50,
              width: 50,
            }}
          />
        </view>
      </color-box-view>
    </page>
  );
}
```

## Summary

- Shadow Node takes control ovr the layout (`measureWithMeasureParam`) and alignment (`alignWithAlignParam`).
- Component can update the Shadow Node properties dynamically and trigger layout request on it.
- The layout system (Starlight) make all ancestors dirty on the path from the node that requested layout up to the root view. Then it triggers the measure calls starting from the root and propagates the values accordingly. If Starlight engine notices custom component, for which ShadowNode has defined a custom function for performing `measure` or `align` operations, it delegates the responsibility for this custom Shadow Node to layout the subtree of the component properly.
