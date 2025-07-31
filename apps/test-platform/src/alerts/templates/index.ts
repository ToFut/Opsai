export const emailTemplates = {
  
};

export const slackTemplates = {
  default: {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Alert Triggered*\n{{description}}'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '*Rule:*\n{{ruleName}}'
          },
          {
            type: 'mrkdwn',
            text: '*Priority:*\n{{priority}}'
          },
          {
            type: 'mrkdwn',
            text: '*Time:*\n{{timestamp}}'
          }
        ]
      }
    ]
  }
};

export const webhookTemplates = {
  default: {
    event: 'alert.triggered',
    data: {
      rule: '{{ruleName}}',
      description: '{{description}}',
      priority: '{{priority}}',
      timestamp: '{{timestamp}}',
      data: '{{alertData}}'
    }
  }
};
