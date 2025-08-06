import { Sequelize } from 'sequelize';
import sequelize from '../config/database';

// Import models
import User from './User';
import Project from './Project';
import Task from './Task';
import Comment from './Comment';
import TimeLog from './TimeLog';
import Notification from './Notification';
import Attachment from './Attachment';
import Activity from './Activity';
import ProjectMember from './ProjectMember';
import Team from './Team';

// Define associations
const setupAssociations = () => {
  // User associations
  User.hasMany(Project, { as: 'ownedProjects', foreignKey: 'ownerId' });
  User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });
  User.hasMany(Task, { as: 'createdTasks', foreignKey: 'creatorId' });
  User.hasMany(Comment, { as: 'comments', foreignKey: 'authorId' });
  User.hasMany(TimeLog, { as: 'timeLogs', foreignKey: 'userId' });
  User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });
  User.hasMany(Activity, { as: 'activities', foreignKey: 'actorId' });
  User.hasMany(Attachment, { as: 'attachments', foreignKey: 'uploadedBy' });
  User.hasMany(Team, { as: 'managedTeams', foreignKey: 'managerId' });

  // Team associations
  Team.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });
  Team.hasMany(Project, { as: 'projects', foreignKey: 'teamId' });

  // Project associations
  Project.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
  Project.belongsTo(Team, { as: 'team', foreignKey: 'teamId' });
  Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });
  Project.hasMany(Comment, { as: 'comments', foreignKey: 'projectId' });
  Project.hasMany(TimeLog, { as: 'timeLogs', foreignKey: 'projectId' });
  Project.hasMany(Activity, { as: 'activities', foreignKey: 'entityId', scope: { entity: 'project' } });
  Project.hasMany(ProjectMember, { as: 'members', foreignKey: 'projectId' });

  // Task associations
  Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
  Task.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
  Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
  Task.hasMany(Comment, { as: 'comments', foreignKey: 'taskId' });
  Task.hasMany(TimeLog, { as: 'timeLogs', foreignKey: 'taskId' });
  Task.hasMany(Attachment, { as: 'attachments', foreignKey: 'taskId' });
  Task.hasMany(Activity, { as: 'activities', foreignKey: 'entityId', scope: { entity: 'task' } });

  // Comment associations
  Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
  Comment.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
  Comment.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
  Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentId' });
  Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentId' });
  Comment.hasMany(Attachment, { as: 'attachments', foreignKey: 'commentId' });

  // TimeLog associations
  TimeLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  TimeLog.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
  TimeLog.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });

  // Notification associations
  Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

  // Attachment associations
  Attachment.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });
  Attachment.belongsTo(Task, { as: 'task', foreignKey: 'taskId' });
  Attachment.belongsTo(Comment, { as: 'comment', foreignKey: 'commentId' });

  // Activity associations
  Activity.belongsTo(User, { as: 'actor', foreignKey: 'actorId' });

  // ProjectMember associations
  ProjectMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });
  ProjectMember.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
};

// Initialize associations
setupAssociations();

export {
  User,
  Project,
  Task,
  Comment,
  TimeLog,
  Notification,
  Attachment,
  Activity,
  ProjectMember,
  Team
};

export default sequelize; 