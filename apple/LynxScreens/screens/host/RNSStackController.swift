import Foundation
import UIKit

@objc
public class RNSStackController: UINavigationController {
    private var needsChildViewControllersUpdate = false
    private let stackHostComponent: RNSStackHostComponent
    
    @objc public required init(stackHostComponent: RNSStackHostComponent) {
        self.stackHostComponent = stackHostComponent
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder aDecoder: NSCoder) {
        return nil
    }
    
    // MARK: Signals
    
    @objc
    public func setNeedsUpdateOfChildViewControllers() {
        needsChildViewControllersUpdate = true
    }
    
    // MARK: Updating
    
    @objc
    public func updateChildViewControllersIfNeeded() {
        if needsChildViewControllersUpdate {
            updateChildViewControllers()
        }
    }
    
    @objc
    public func updateChildViewControllers() {
        precondition(
            needsChildViewControllersUpdate,
            "[RNScreens] Child view controller must be invalidated when update is forced!")
        
        let activeControllers = sourceAllViewControllers()
            .filter { screenCtrl in screenCtrl.screen.activityMode == .attached }
        
        setViewControllers(activeControllers, animated: true)
        
        needsChildViewControllersUpdate = false
    }
    
    private func sourceAllViewControllers() -> [RNSStackScreenController] {
        let screenStackComponents =
        stackHostComponent.children as! [RNSStackScreenComponent]
        return screenStackComponents.lazy.map(\.controller)
    }
    
    @objc
    public func lynxMountingTransactionDidFinish() {
        updateChildViewControllersIfNeeded()
    }
}
