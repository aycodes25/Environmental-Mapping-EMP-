export function getLambdaEventSource(event: any) {
    if (event.Records && event.Records[0].cf) return "isCloudfront"
  
    if (event.configRuleId && event.configRuleName && event.configRuleArn) return "isAwsConfig"
  
    if (event.Records && event.Records[0].eventSource === "aws:codecommit") return "isCodeCommit"
  
    if (typeof event === "string" || event.fn) return "isCmd"
  
    if (event.routeKey && event.requestContext?.domainName.includes("lambda-url")) return "isFuntionUrl"
  
    if (event.requestContext || event.authorizationToken || event.pathParameters) return "isApiGateway"
  
    if (event.StackId && event.RequestType && event.ResourceType) return "isCloudFormation"
  
    if (event.Records && event.Records[0].eventSource === "aws:ses") return "isSes"
  
    if (event.source === "aws.events") return "isScheduledEvent"
  
    if (event.source === "aws.scheduler" || (event.event_name && event.payload)) return "isEventScheduler"
  
    if (event.awslogs && event.awslogs.data) return "isCloudWatchLogs"
  
    if (event.Records && event.Records[0].EventSource === "aws:sns") return "isSns"
  
    if (event.Records && event.Records[0].eventSource === "aws:sqs") return "isSqs"
  
    if (event.Records && event.Records[0].eventSource === "aws:dynamodb") return "isDynamoDb"
  
    if (event.records && event.records[0].approximateArrivalTimestamp) return "isKinesisFirehose"
  
    if (event.records && event.deliveryStreamArn && event.deliveryStreamArn.startsWith("arn:aws:kinesis:")) return "isKinesisFirehose"
  
    if (event.eventType === "SyncTrigger" && event.identityId && event.identityPoolId) return "isCognitoSyncTrigger"
  
    if (event.Records && event.Records[0].eventSource === "aws:kinesis") return "isKinesis"
  
    if (event.Records && event.Records[0].eventSource === "aws:s3") return "isS3"
  
    if (event.operation && event.message) return "isMobileBackend"
  }