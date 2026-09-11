#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN
FOUNDATION_EXPORT NSDictionary *_Nullable RNSTraceParse(NSString *_Nullable value);
FOUNDATION_EXPORT NSDictionary *_Nullable RNSTraceSession(NSString *_Nullable value);
FOUNDATION_EXPORT NSDictionary *_Nullable RNSTraceContent(NSString *_Nullable value);
FOUNDATION_EXPORT BOOL RNSTraceEnabled(void);
FOUNDATION_EXPORT void RNSTraceInstant(NSString *name, NSDictionary *fields);
FOUNDATION_EXPORT void RNSTraceSection(NSString *name, NSDictionary *fields, void (^block)(void));
FOUNDATION_EXPORT NSDictionary *RNSTraceFields(NSDictionary *identity);

@interface RNSTraceBatch : NSObject
@property(nonatomic, copy, readonly) NSDictionary *session;
- (nullable NSDictionary *)consumeForContainer:(NSString *)container expected:(NSDictionary *)expected;
@end
@interface RNSNavigatorTraceScope : NSObject
@property(nonatomic, copy, readonly) NSDictionary *session;
+ (instancetype)scopeWithContext:(id)context session:(NSDictionary *)session;
+ (nullable instancetype)findWithContext:(id)context session:(nullable NSDictionary *)session;
- (nullable RNSTraceBatch *)stage:(nullable NSString *)envelope;
- (nullable RNSTraceBatch *)capture;
- (void)endBatch:(nullable RNSTraceBatch *)batch;
@end
@interface RNSNavigationTraceOperation : NSObject
@property(nonatomic, copy, readonly) NSDictionary *identity;
@property(nonatomic, copy, readonly) NSString *prefix;
@property(nonatomic, readonly) BOOL terminal;
- (instancetype)initWithPrefix:(NSString *)prefix
                     container:(NSString *)container
                       session:(NSDictionary *)session
                     operation:(NSString *)operation
                        origin:(NSString *)origin
                       binding:(nullable NSDictionary *)binding
                      contents:(NSDictionary<NSString *, NSDictionary *> *)contents
                 nativeRequest:(BOOL)nativeRequest;
- (NSDictionary *)identityForScreen:(nullable NSString *)screen;
- (NSDictionary *)lifecycleIdentityForScreen:(nullable NSString *)screen;
- (void)mark:(NSString *)event fields:(NSDictionary *)fields;
- (void)start:(BOOL)animated;
- (void)finish:(NSString *)status reason:(nullable NSString *)reason;
@end
NS_ASSUME_NONNULL_END
