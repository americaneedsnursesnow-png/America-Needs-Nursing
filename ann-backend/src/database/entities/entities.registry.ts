import { BlogPost } from './blog-post.entity';
import { Client } from './client.entity';
import { CommunityChatMessage } from './community-chat-message.entity';
import { CommunityComment } from './community-comment.entity';
import { CommunityMemberReport } from './community-member-report.entity';
import { CommunityPost } from './community-post.entity';
import { Company } from './company.entity';
import { CompanyFollow } from './company-follow.entity';
import { Conversation } from './conversation.entity';
import { Job } from './job.entity';
import { JobPackage } from './job-package.entity';
import { JobApplication } from './job-application.entity';
import { Message } from './message.entity';
import { NewsletterBroadcast } from './newsletter-broadcast.entity';
import { NewsletterEvent } from './newsletter-event.entity';
import { NewsletterSubscriber } from './newsletter-subscriber.entity';
import { Notification } from './notification.entity';
import { NurseCommunity } from './nurse-community.entity';
import { NurseCommunityMember } from './nurse-community-member.entity';
import { NurseDatabaseRecord } from './nurse-database-record.entity';
import { NurseProfile } from './nurse-profile.entity';
import { SavedJob } from './saved-job.entity';
import { User } from './user.entity';

export const typeOrmEntities = [
  Client,
  User,
  NurseProfile,
  Company,
  Job,
  JobPackage,
  JobApplication,
  SavedJob,
  CompanyFollow,
  Conversation,
  Message,
  BlogPost,
  NewsletterSubscriber,
  NewsletterBroadcast,
  NewsletterEvent,
  CommunityPost,
  CommunityComment,
  CommunityMemberReport,
  CommunityChatMessage,
  NurseCommunity,
  NurseCommunityMember,
  Notification,
  NurseDatabaseRecord,
];
