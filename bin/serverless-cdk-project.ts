#!/usr/bin/env source-map-support/register
import * as cdk from 'aws-cdk-lib';
import { ServerlessCdkProjectStack } from '../lib/serverless-cdk-project-stack';

const app = new cdk.App();

new ServerlessCdkProjectStack(app, 'ServerlessCdkProjectStack', {
  /* Enforce region/account settings if needed, or leave blank for defaults */
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});