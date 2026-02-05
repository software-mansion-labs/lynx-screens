# Shadow Nodes in Lynx - guide for Android

This guide will walk through step-by-step process of creating a Custom Shadow Node associated with Custom Native Element in Lynx system. It covers

- Creating a Custom Shadow Node
- Registering the Custom Shadow Node
- Implementing custom logic for updating component size and children positioning
- Passing information between the Native Element and the Shadow Node instance via properties

---

## Project Structure

We're relying on 2 classes

- **LynxColorBoxComponent** - The Component is a wrapper over a view which is responsible for creating the view, mapping properties passed from the JS layer to the native component and handling interaction between the Shadow Node and the native component.
- **LynxColorBoxShadowNode** - A Custom Shadow Node with dedicated logic for view resizing and children offsets.

---

## Creating a Custom Shadow Node step-by-step

### Step 1 - Define the ShadowNode class

Create a Shadow Node class that inherits from `com.lynx.tasm.behavior.shadow.ShadowNode` and implements the `com.lynx.tasm.behavior.shadow.CustomMeasureFunc` interface (required for implementing custom methods for correcting the measurement and alignment).

- **LynxColorBoxShadowNode.kt**

```kotlin
package com.lynxscreens.elements

import com.lynx.tasm.behavior.LynxShadowNode
import com.lynx.tasm.behavior.shadow.AlignContext
import com.lynx.tasm.behavior.shadow.AlignParam
import com.lynx.tasm.behavior.shadow.CustomMeasureFunc
import com.lynx.tasm.behavior.shadow.MeasureContext
import com.lynx.tasm.behavior.shadow.MeasureParam
import com.lynx.tasm.behavior.shadow.MeasureResult
import com.lynx.tasm.behavior.shadow.ShadowNode
import kotlin.math.ceil

// Registers this custom ShadowNode implementation for the "color-box-view" component
@LynxShadowNode(tagName = "color-box-view")
class LynxColorBoxShadowNode : ShadowNode(), CustomMeasureFunc {
    init {
        setCustomMeasureFunc(this)
    }

    override fun measure(param: MeasureParam?, context: MeasureContext?): MeasureResult {
        return MeasureResult(0f, 0f)
    }

    override fun align(param: AlignParam?, context: AlignContext?) {
        // NO-OP
    }
}
```

### Step 2 - Implement the Custom Shadow Node logic

- **LynxColorBoxShadowNode.kt**

### Step 2.1 – Implement `measure(param: MeasureParam?, context: MeasureContext?)` to send component size updates.

```kotlin
#import com.lynx.tasm.behavior.shadow.NativeLayoutNodeRef
...
@LynxShadowNode(tagName = "color-box-view")
class LynxColorBoxShadowNode : ShadowNode(), CustomMeasureFunc {
    private var mUIHeight:Int = 0
    private var mUIWidth:Int = 0
    ...
    // Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
    // Since we define a custom measurement method, we take full control over
    // sizing for the entire layout subtree. This method calculates and returns
    // the size of the native view and recursively measures child nodes.
    override fun measure(param: MeasureParam?, context: MeasureContext?): MeasureResult {
        val width = ceil(mUIWidth.toDouble()).toFloat()
        val height = ceil(mUIHeight.toDouble()).toFloat()

        if (childCount > 0) {
            val firstChild = getChildAt(0)
            if (firstChild is NativeLayoutNodeRef) {
                val childParam = param ?: MeasureParam()
                childParam.mHeight = height
                childParam.mWidth = width

                firstChild.measureNativeNode(context, childParam)
            }
        }

        return MeasureResult(width, height)
    }
    ...
}
```

### Step 2.2 – Implement `align(param: AlignParam?, context: AlignContext?)` to update children positioning (offsets)

```kotlin
// Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
// By defining a custom alignment method, we take control over positioning
// for the current subtree. Here, we offset the content by a fixed amount.
override fun align(param: AlignParam?, context: AlignContext?) {
    val density = mContext?.resources?.displayMetrics?.density
    val offset = (100 * (density ?: 0f))

    val alignParam = param ?: AlignParam()

    alignParam.leftOffset = offset
    alignParam.topOffset = offset

    if (childCount > 0) {
        val firstChild = getChildAt(0)
        if (firstChild is NativeLayoutNodeRef) {
            firstChild.alignNativeNode(context, alignParam)
        }
    }
}
```

### Step 2.3 – Add method that will update ShadowNode state and will request layout

```kotlin
internal fun updateSize(updatedWitdh: Int, updatedHeight: Int) {
    var dirty = false
    if (updatedHeight != mUIHeight) {
        mUIHeight = updatedHeight
        dirty = true
    }

    if (updatedWitdh != mUIWidth) {
        mUIWidth = updatedHeight
        dirty = true
    }

    if (dirty) {
        this.resetIsDirty()
        this.markDirty()
        this.setNeedsLayoutForce()
    }
}
```

### Result

```kotlin
package com.lynxscreens.elements

import com.lynx.tasm.behavior.LynxShadowNode
import com.lynx.tasm.behavior.shadow.AlignContext
import com.lynx.tasm.behavior.shadow.AlignParam
import com.lynx.tasm.behavior.shadow.CustomMeasureFunc
import com.lynx.tasm.behavior.shadow.MeasureContext
import com.lynx.tasm.behavior.shadow.MeasureParam
import com.lynx.tasm.behavior.shadow.MeasureResult
import com.lynx.tasm.behavior.shadow.NativeLayoutNodeRef
import com.lynx.tasm.behavior.shadow.ShadowNode
import kotlin.math.ceil

// Registers this custom ShadowNode implementation for the "color-box-view" component
@LynxShadowNode(tagName = "color-box-view")
class LynxColorBoxShadowNode : ShadowNode(), CustomMeasureFunc {
    private var mUIHeight:Int = 0
    private var mUIWidth:Int = 0

    init {
        setCustomMeasureFunc(this)
    }

    internal fun updateSize(updatedWitdh: Int, updatedHeight: Int) {
        var dirty = false
        if (updatedHeight != mUIHeight) {
            mUIHeight = updatedHeight
            dirty = true
        }

        if (updatedWitdh != mUIWidth) {
            mUIWidth = updatedHeight
            dirty = true
        }

        if (dirty) {
            this.resetIsDirty()
            this.markDirty()
            this.setNeedsLayoutForce()
        }
    }

    // Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateMeasure`.
    // Since we define a custom measurement method, we take full control over
    // sizing for the entire layout subtree. This method calculates and returns
    // the size of the native view and recursively measures child nodes.
    override fun measure(param: MeasureParam?, context: MeasureContext?): MeasureResult {
        val width = ceil(mUIWidth.toDouble()).toFloat()
        val height = ceil(mUIHeight.toDouble()).toFloat()

        if (childCount > 0) {
            val firstChild = getChildAt(0)
            if (firstChild is NativeLayoutNodeRef) {
                val childParam = param ?: MeasureParam()
                childParam.mHeight = height
                childParam.mWidth = width

                firstChild.measureNativeNode(context, childParam)
            }
        }

        return MeasureResult(width, height)
    }

    // Called during the layout pass when `LayoutObject::ReLayoutWithConstraints` triggers `UpdateAlignment`.
    // By defining a custom alignment method, we take control over positioning
    // for the current subtree. Here, we offset the content by a fixed amount.
    override fun align(param: AlignParam?, context: AlignContext?) {
        val density = mContext?.resources?.displayMetrics?.density
        val offset = (100 * (density ?: 0f))

        val alignParam = param ?: AlignParam()

        alignParam.leftOffset = offset
        alignParam.topOffset = offset

        if (childCount > 0) {
            val firstChild = getChildAt(0)
            if (firstChild is NativeLayoutNodeRef) {
                firstChild.alignNativeNode(context, alignParam)
            }
        }
    }
}
```

### Step 3 – Implement the communication between ShadowNode and Component

We link our ShadowNode with the actual view. At this point, based on the read view parameters (e.g., frame), we can introduce our layout corrections and request the ShadowNode to update the layout.

- **LynxColorBoxComponent.kt**

```kotlin
// Note: This doesn't seem to be good place to apply updates (considering Screens impl), but
// it's sufficient for basic testing and demonstration purposes.
override fun onLayoutUpdated() {
    super.onLayoutUpdated()

    // Retrieve the corresponding ShadowNode from the Lynx context by node sign (unique ID)
    lynxContext.findShadowNodeBySign(sign)?.let {
        // Ensure that the retrieved node is an instance of our custom ShadowNode class
        if (it is LynxColorBoxShadowNode) {
            // Store the previously set size
            val oldWidth = this.width
            val oldHeight = this.height

            // Perform some calculations for updating the size
            val (newWidth, newHeight) = adjustViewSize()

            // If the size has changed, update the ShadowNode
            if (oldWidth != newWidth || oldHeight != newHeight) {
                it.updateSize(newWidth, newHeight)
            }
        }
    }
}

// Returns a hardcoded width and height for testing purposes
private fun adjustViewSize(): Pair<Int, Int> {
    val sizeDp = 300

    val density = mContext.resources.displayMetrics.density

    val widthPx = (sizeDp * density).toInt()
    val heightPx = (sizeDp * density).toInt()

    return Pair(widthPx, heightPx)
}
```

### Step 4 - Override `createShadowNode` method for the Behavior associated with the Component to add Custom ShadowNode to the registry

`createShadowNode` when triggered, will return the instance of the CustomShadowNode implementation.

- **MainActivity.kt**

```kotlin
package com.lynxscreens
...
class MainActivity : Activity() {
    ...
    private fun buildLynxView(): LynxView {
        val viewBuilder: LynxViewBuilder = LynxViewBuilder()
        
        ...

        viewBuilder.addBehavior(object : Behavior("color-box-view") {
            // Override this method to create an instance of Custom ShadowNode to put it in the
            // registry.
            override fun createShadowNode(): ShadowNode? {
                return LynxColorBoxShadowNode()
            }
        })

        return viewBuilder.build(this)
    }
}
```

### Step 5 - Adding the Custom Native Element to the JS Application

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
          borderWidth: '2px',
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: '100px',
            width: '100px',
          }}
        />
      </color-box-view>
      <color-box-view
        style={{
          flex: 1,
          borderColor: '#f01313',
          borderWidth: '2px',
          display: 'flex',
        }}
        backgroundColorHex={color}
      >
        <view
          style={{
            backgroundColor: '#f01313',
            display: 'flex',
            height: '100px',
            width: '100px',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }}
        >
          <view
            style={{
              backgroundColor: '#1364f0',
              display: 'flex',
              height: '50px',
              width: '50px',
            }}
          />
        </view>
      </color-box-view>
    </page>
  );
}
```

## Summary

- Shadow Node takes control over the layout - `measure(param: MeasureParam?, context: MeasureContext?)` and alignment - `align(param: AlignParam?, context: AlignContext?)`.
- Component can update the Shadow Node properties dynamically. ShadowNode should mark itself as dirty and request for layout update, if needed.
- The layout system (Starlight) make all ancestors dirty on the path from the node that requested layout up to the root view. Then it triggers the measure calls starting from the root and propagates the values accordingly. If Starlight engine notices custom component, for which ShadowNode has defined a custom function for performing `measure` or `align` operations, it delegates the responsibility for this custom Shadow Node to layout the subtree of the component properly.
