#import "RNSNavigationTrace.h"
#import <math.h>
#if __has_include(<Lynx/LynxTraceEvent.h>)
#import <Lynx/LynxTraceEvent.h>
#define RNS_HAS_TRACE 1
#else
#define RNS_HAS_TRACE 0
#endif

static BOOL RNSID(id value)
{
    return [value isKindOfClass:NSString.class] && [value length] > 0 && [value length] <= 1024;
}
NSDictionary *RNSTraceParse(NSString *value)
{
    if (![value isKindOfClass:NSString.class] || value.length > 65536)
        return nil;
    id json = [NSJSONSerialization JSONObjectWithData:[value dataUsingEncoding:NSUTF8StringEncoding]
                                              options:0
                                                error:NULL];
    return [json isKindOfClass:NSDictionary.class] && [json[@"version"] isEqual:@1] ? json : nil;
}
NSDictionary *RNSTraceSession(NSString *value)
{
    NSDictionary *json = RNSTraceParse(value);
    return RNSID(json[@"runtimeId"]) && RNSID(json[@"navigatorKey"]) && [json[@"enabled"] isEqual:@YES] ? json : nil;
}
NSDictionary *RNSTraceContent(NSString *value)
{
    NSDictionary *json = RNSTraceParse(value);
    return RNSID(json[@"runtimeId"]) && RNSID(json[@"navigatorKey"]) && RNSID(json[@"screenKey"]) &&
                   RNSID(json[@"contentScopeId"])
               ? json
               : nil;
}
static NSArray *RNSSessionKey(NSDictionary *session) { return @[ session[@"runtimeId"], session[@"navigatorKey"] ]; }
BOOL RNSTraceEnabled(void)
{
#if RNS_HAS_TRACE
    @try
    {
        return [LynxTraceEvent categoryEnabled:@"lynx"];
    }
    @catch (NSException *exception)
    {
        return NO;
    }
#else
    return NO;
#endif
}
void RNSTraceInstant(NSString *name, NSDictionary *fields)
{
#if RNS_HAS_TRACE
    if (!RNSTraceEnabled())
        return;
    @try
    {
        [LynxTraceEvent instant:@"lynx" withName:name debugInfo:fields];
    }
    @catch (NSException *exception)
    {
    }
#endif
}
void RNSTraceSection(NSString *name, NSDictionary *fields, void (^block)(void))
{
    BOOL began = NO;
#if RNS_HAS_TRACE
    @try
    {
        if (RNSTraceEnabled())
        {
            [LynxTraceEvent beginSection:@"lynx" withName:name debugInfo:fields];
            began = YES;
        }
    }
    @catch (NSException *exception)
    {
    }
#endif
    @try
    {
        block();
    }
    @finally
    {
#if RNS_HAS_TRACE
        @try
        {
            if (began)
                [LynxTraceEvent endSection:@"lynx" withName:name];
        }
        @catch (NSException *exception)
        {
        }
#endif
    }
}
NSDictionary *RNSTraceFields(NSDictionary *identity)
{
    NSDictionary *keys = @{
        @"runtimeId" : @"runtime_id",
        @"navigatorKey" : @"navigator_key",
        @"containerId" : @"container_id",
        @"navigationTraceId" : @"navigation_trace_id",
        @"nativeTransitionId" : @"native_transition_id",
        @"screenKey" : @"screen_key",
        @"contentScopeId" : @"content_scope_id",
        @"operation" : @"operation",
        @"origin" : @"origin"
    };
    NSMutableDictionary *fields = [NSMutableDictionary new];
    for (NSString *key in keys)
        if (identity[key])
            fields[keys[key]] = identity[key];
    return fields;
}
@implementation RNSTraceBatch
{
    NSArray<NSDictionary *> *_bindings;
    NSMutableSet<NSString *> *_consumed;
}
- (instancetype)initWithSession:(NSDictionary *)session bindings:(NSArray *)bindings
{
    if (self = [super init])
    {
        _session = [session copy];
        _bindings = [bindings copy];
        _consumed = [NSMutableSet new];
    }
    return self;
}
- (NSDictionary *)consumeForContainer:(NSString *)container expected:(NSDictionary *)expected
{
    if ([_consumed containsObject:container])
        return nil;
    [_consumed addObject:container];
    NSDictionary *match = nil;
    for (NSDictionary *binding in _bindings)
        if ([binding[@"expectedChange"] isEqual:expected])
        {
            if (match)
                return nil;
            match = binding;
        }
    return match;
}
@end
static NSMapTable *RNSScopes(void)
{
    static NSMapTable *scopes;
    static dispatch_once_t once;
    dispatch_once(&once, ^{
      scopes = [NSMapTable weakToStrongObjectsMapTable];
    });
    return scopes;
}
@implementation RNSNavigatorTraceScope
{
    RNSTraceBatch *_batch;
    double _lastSequence;
}
+ (instancetype)scopeWithContext:(id)context session:(NSDictionary *)session
{
    RNSNavigatorTraceScope *scope = [self findWithContext:context session:session];
    if (scope)
        return scope;
    scope = [self new];
    scope->_session = [session copy];
    scope->_lastSequence = -1;
    NSMapTable *entries = [RNSScopes() objectForKey:context];
    if (!entries)
    {
        entries = [NSMapTable strongToWeakObjectsMapTable];
        [RNSScopes() setObject:entries forKey:context];
    }
    [entries setObject:scope forKey:RNSSessionKey(session)];
    return scope;
}
+ (instancetype)findWithContext:(id)context session:(NSDictionary *)session
{
    if (!context || !session)
        return nil;
    return [[RNSScopes() objectForKey:context] objectForKey:RNSSessionKey(session)];
}
- (RNSTraceBatch *)stage:(NSString *)envelope
{
    _batch = nil;
    NSDictionary *json = RNSTraceParse(envelope);
    if (![json[@"runtimeId"] isEqual:_session[@"runtimeId"]] ||
        ![json[@"navigatorKey"] isEqual:_session[@"navigatorKey"]])
        return nil;
    NSNumber *sequence = json[@"sequence"];
    if (![sequence isKindOfClass:NSNumber.class] || !isfinite(sequence.doubleValue) ||
        floor(sequence.doubleValue) != sequence.doubleValue || sequence.doubleValue < 0 ||
        sequence.doubleValue > 9007199254740991.0 || sequence.doubleValue <= _lastSequence)
        return nil;
    NSArray *bindings = json[@"bindings"];
    if (![bindings isKindOfClass:NSArray.class] || bindings.count > 256)
        return nil;
    for (id binding in bindings)
    {
        if (![binding isKindOfClass:NSDictionary.class] || !RNSID(binding[@"navigationTraceId"]) ||
            !RNSID(binding[@"actionType"]))
            return nil;
        NSDictionary *change = binding[@"expectedChange"];
        if (![change isKindOfClass:NSDictionary.class])
            return nil;
        if ([change[@"kind"] isEqual:@"stack"])
        {
            for (NSString *key in @[ @"beforeScreenKeys", @"afterScreenKeys" ])
            {
                NSArray *screens = change[key];
                if (![screens isKindOfClass:NSArray.class] || screens.count > 256)
                    return nil;
                for (id screen in screens)
                    if (!RNSID(screen))
                        return nil;
            }
        }
        else if ([change[@"kind"] isEqual:@"sheet"])
        {
            if (!RNSID(change[@"screenKey"]) || ![change[@"fromOpen"] isKindOfClass:NSNumber.class] ||
                ![change[@"toOpen"] isKindOfClass:NSNumber.class])
                return nil;
        }
        else
            return nil;
    }
    _lastSequence = sequence.doubleValue;
    _batch = [[RNSTraceBatch alloc] initWithSession:_session bindings:bindings];
    return _batch;
}
- (RNSTraceBatch *)capture
{
    return _batch;
}
- (void)endBatch:(RNSTraceBatch *)batch
{
    if (_batch == batch)
        _batch = nil;
}
@end
@implementation RNSNavigationTraceOperation
{
    NSDictionary<NSString *, NSDictionary *> *_contents;
    BOOL _started;
}
- (instancetype)initWithPrefix:(NSString *)prefix
                     container:(NSString *)container
                       session:(NSDictionary *)session
                     operation:(NSString *)operation
                        origin:(NSString *)origin
                       binding:(NSDictionary *)binding
                      contents:(NSDictionary *)contents
                 nativeRequest:(BOOL)nativeRequest
{
    if (self = [super init])
    {
        _prefix = [prefix copy];
        NSMutableDictionary *matchingContents = [NSMutableDictionary new];
        for (NSString *key in contents)
        {
            NSDictionary *content = contents[key];
            if ([content[@"runtimeId"] isEqual:session[@"runtimeId"]] &&
                [content[@"navigatorKey"] isEqual:session[@"navigatorKey"]])
                matchingContents[key] = content;
        }
        _contents = [matchingContents copy];
        NSMutableDictionary *identity = [@{
            @"version" : @1,
            @"containerId" : container,
            @"runtimeId" : session[@"runtimeId"],
            @"navigatorKey" : session[@"navigatorKey"],
            @"nativeTransitionId" : [NSString stringWithFormat:@"%@:transition:%@", container, NSUUID.UUID.UUIDString],
            @"operation" : operation,
            @"origin" : origin
        } mutableCopy];
        if (nativeRequest)
            identity[@"navigationTraceId"] = [@"native:" stringByAppendingString:NSUUID.UUID.UUIDString];
        else if (binding[@"navigationTraceId"])
            identity[@"navigationTraceId"] = binding[@"navigationTraceId"];
        _identity = [identity copy];
        for (NSString *key in _contents)
            RNSTraceInstant([prefix stringByAppendingString:@".ScreenContentBound"],
                            RNSTraceFields([self identityForScreen:key]));
    }
    return self;
}
- (NSDictionary *)identityForScreen:(NSString *)screen
{
    NSMutableDictionary *identity = [_identity mutableCopy];
    if (screen)
        identity[@"screenKey"] = screen;
    if (_contents[screen ?: @""][@"contentScopeId"])
        identity[@"contentScopeId"] = _contents[screen][@"contentScopeId"];
    return [identity copy];
}
- (NSDictionary *)lifecycleIdentityForScreen:(NSString *)screen
{
    NSMutableDictionary *identity = [[self identityForScreen:screen] mutableCopy];
    // A later host/window lifecycle change must not revive a completed operation.
    if (_terminal)
        [identity removeObjectsForKeys:@[ @"navigationTraceId", @"nativeTransitionId", @"operation", @"origin" ]];
    return [identity copy];
}
- (void)mark:(NSString *)event fields:(NSDictionary *)fields
{
    NSMutableDictionary *args = [RNSTraceFields(_identity) mutableCopy];
    [args addEntriesFromDictionary:fields];
    RNSTraceInstant([_prefix stringByAppendingFormat:@".%@", event], args);
}
- (void)start:(BOOL)animated
{
    if (_terminal || _started)
        return;
    _started = YES;
    [self mark:@"NativeTransitionStart" fields:@{@"is_animated" : @(animated)}];
}
- (void)finish:(NSString *)status reason:(NSString *)reason
{
    if (_terminal)
        return;
    _terminal = YES;
    NSString *event = [status isEqual:@"completed"]   ? @"NativeTransitionEnd"
                      : [status isEqual:@"prevented"] ? @"NativeDismissPrevented"
                                                      : @"NativeTransitionCancelled";
    [self mark:event fields:reason ? @{@"status" : status, @"reason" : reason} : @{@"status" : status}];
}
@end
