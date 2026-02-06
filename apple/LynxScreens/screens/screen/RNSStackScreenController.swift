import Foundation
import UIKit

@objc
public class RNSStackScreenController: UIViewController {
    @objc public var screen: RNSStackScreenComponent
    
    @objc public required init(component: RNSStackScreenComponent) {
        self.screen = component
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder aDecoder: NSCoder) {
        return nil
    }
    
    // MARK: Events
    
    public override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        screen.notifyLifecycleChange(.willAppear)
    }
    
    public override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        screen.notifyLifecycleChange(.didAppear)
    }
    
    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        screen.notifyLifecycleChange(.willDisappear)
    }
    
    public override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        screen.notifyLifecycleChange(.didDisappear)
    }
    
    public override func didMove(toParent parent: UIViewController?) {
        print("ScreenCtrl [\(self.screen.view().tag)] didMoveToParent \(String(describing: parent))")
        super.didMove(toParent: parent)
        
        if parent == nil {
            if self.screen.activityMode == .detached {
                screen.emitOnDismiss()
            } else {
                screen.emitOnNativeDismiss()
            }
        }
    }
}
