const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../../frontend/messages/en.json');
const zhPath = path.join(__dirname, '../../frontend/messages/zh.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// Complete Chinese translations dictionary
const translations = {
  // Metadata & Nav & Menu
  "stududu — Practice speaking foreign languages": "stududu — 外语口语练习",
  "Language exchange and 1:1 speaking practice platform": "语言交换与 1:1 口语练习平台",
  "Discover": "探索",
  "Messages": "消息",
  "Vocabulary": "词汇",
  "Community": "社区",
  "Profile": "个人资料",
  "Settings": "设置",
  "Admin panel": "管理面板",
  "Log out": "退出登录",
  "Log Out": "退出登录",

  // Settings
  "Interface language": "界面语言",
  "UI chrome only — user-generated content stays in its original language.": "仅更改界面显示语言 — 用户生成的内容保留原语言。",
  "Change password": "修改密码",
  "Share activity": "分享动态",
  "Blocked users": "已屏蔽用户",
  "Activity sharing enabled": "已启用动态分享",
  "Activity sharing disabled": "已禁用动态分享",
  "Passwords do not match.": "两次输入的密码不一致。",
  "Password updated successfully": "密码更新成功",
  "Unblocked {name}": "已解除屏蔽 {name}",
  "Minimum 8 characters, including both letters and numbers.": "至少8个字符，包含字母和数字。",
  "Current password": "当前密码",
  "New password": "新密码",
  "Confirm new password": "确认新密码",
  "Updating...": "更新中...",
  "Update password": "更新密码",
  "Automatically post to Community when you add a word or reach conversation milestones.": "当您添加新词汇或达到对话里程碑时，自动发布到社区。",
  "Enabled": "已启用",
  "Disabled": "已禁用",
  "You haven't blocked anyone.": "您尚未屏蔽任何用户。",
  "Unblock": "解除屏蔽",

  // Common
  "Save changes": "保存更改",
  "Cancel": "取消",
  "Loading...": "加载中...",
  "Retry": "重试",
  "or": "或",
  "Something went wrong. Please try again.": "出错了，请重试。",

  // Home
  "Login": "登录",
  "Register": "注册",
  "Practice speaking foreign languages with": "与真正的母语者",
  "real native speakers": "练习外语口语",
  "Find your perfect language exchange partner. You teach your language, they teach yours. Entirely free, mutual-based.": "寻找您理想的语言交换伙伴。你教你的母语，对方教他们的母语。完全免费，互帮互助。",
  "Get started now": "立即开始",

  // Login
  "Welcome back to stududu": "欢迎回到 stududu",
  "Email": "电子邮箱",
  "Password": "密码",
  "Remember me": "记住我",
  "Forgot password?": "忘记密码？",
  "Signing in...": "正在登录...",
  "Continue with Google": "使用 Google 账号登录",
  "Sign in with Google: UI is ready. API integration will be configured once the Backend is complete.": "使用 Google 登录：界面已准备就绪。",
  "Don't have an account?": "还没有账号？",
  "Sign up now": "立即注册",
  "Learn languages with real native speakers.": "与母语者一起学习语言。",
  "You teach your language, they teach theirs. A fair exchange — no scores, no fees.": "你教你的母语，对方教他们的母语。公平交换 — 无需积分，无需付费。",
  "Matched by complementary languages, not by score": "根据互补语言匹配，而非根据分数",
  "Direct 1:1 chat, practise your reflexes every day": "一对一直接聊天，每天练习反应能力",
  "Contributions recognised with praise, not rankings": "通过赞扬认可贡献，而非排名",
  "stududu — language exchange, Tandem style": "stududu — Tandem 风格的语言交换",

  // Register
  "Create an account": "创建账号",
  "Start your language journey": "开启您的语言学习之旅",
  "Practice speaking with real native speakers.": "与真正的母语者练习口语。",
  "You teach your language, they teach yours.": "你教 your 语言，对方教对方的语言。",
  "Display name": "显示名称",
  "First name": "名",
  "Surname": "姓",
  "Date of birth": "出生日期",
  "Day": "日",
  "Month": "月",
  "Year": "年",
  "Gender": "性别",
  "Select your gender": "选择您的性别",
  "Female": "女",
  "Male": "男",
  "Custom / Other": "自定义 / 其他",
  "Country": "国家/地区",
  "Select country": "选择国家/地区",
  "Mobile number or email address": "手机号码或电子邮箱",
  "Confirm password": "确认密码",
  "Signing up...": "正在注册...",
  "Continue with Google": "使用 Google 账号注册",
  "Already have an account?": "已有账号？",
  "Native language": "母语",
  "Learning language": "正在学习的语言",
  "Target level": "目标水平",
  "Registration successful!": "注册成功！",
  "By clicking Register, you agree to our Terms of Service and Privacy Policy.": "点击注册即表示您同意我们的服务条款和隐私政策。",

  // Discover
  "Find Language Partners": "探索语伴",
  "Find exchange partners to practice speaking": "寻找适合您练习口语的语言交换伙伴",
  "Search by name, language, or interest...": "按姓名、语言或兴趣搜索...",
  "Native": "母语",
  "Learning": "学习中",
  "Filters": "筛选",
  "All languages": "所有语言",
  "Online only": "仅看在线",
  "No partners found.": "未找到匹配的语伴。",
  "Try adjusting your search or filter options.": "尝试调整您的搜索条件或筛选器。",
  "Connect": "联系",
  "Chat now": "发起聊天",
  "Compatibility": "匹配度",
  "Shared topics": "共同话题",

  // Community
  "Language Community": "语言社区",
  "Share experiences and ask questions with learners worldwide": "与全球学习者交流经验、提出问题",
  "Create post": "发布帖子",
  "Share your language learning experience or ask a question...": "分享您的语言学习经验或提出问题...",
  "Post": "发布",
  "Posting...": "正在发布...",
  "Likes": "赞",
  "Comments": "评论",
  "Share": "分享",
  "Write a comment...": "撰写评论...",
  "No posts yet. Be the first to share!": "暂无帖子。成为第一个发布动态的人吧！",
  "All": "全部",
  "Following": "正在关注",
  "Popular": "热门",
  "Topic": "话题",

  // Language Switcher
  "Select language": "选择语言",
  "Chinese": "中文",

  // Vocabulary
  "My Vocabulary": "我的词汇本",
  "Save and review new words from your conversations": "在对话中保存并复习新单词",
  "Add word": "添加新词",
  "Type a word...": "输入单词...",
  "Type translation...": "输入翻译...",
  "Example sentence (optional)...": "例句（可选）...",
  "Save word": "保存单词",
  "Search vocabulary...": "搜索词汇...",
  "Your vocabulary list is empty.": "您的词汇本为空。",
  "Long press or select text in chat to add new words.": "在聊天中长按或选择文本以添加新词。",
  "Mastered": "已掌握",
  "Review": "复习模式",
  "Quiz": "词汇测验",
  "Are you sure you want to delete this word?": "确定要删除此单词吗？",

  // Profile & Edit Profile
  "Edit profile": "编辑资料",
  "Save profile": "保存资料",
  "Native languages": "母语",
  "Learning languages": "学习语言",
  "Bio": "个人简介",
  "Tell us about your learning goals...": "介绍一下您的语言学习目标...",
  "Interests": "兴趣爱好",
  "Learning Stats": "学习统计",
  "Conversations": "对话次数",
  "Words Learned": "已学词汇",
  "Day Streak": "连续学习天数",
  "Member since": "加入时间",

  // Chat
  "Type a message...": "输入消息...",
  "Send": "发送",
  "Online": "在线",
  "Offline": "离线",
  "Last seen": "上次在线",
  "Translate": "翻译",
  "Save to vocabulary": "存入词汇本",
  "Audio call": "语音通话",
  "Video call": "视频通话",
  "End call": "挂断",
  "Schedule practice": "预约练习",
  "Send a message to start the conversation!": "发送第一条消息开启对话吧！",

  // Forgot password
  "Reset Password": "重置密码",
  "Enter your email address and we'll send you a link to reset your password.": "输入您的邮箱地址，我们将向您发送重置链接。",
  "Send reset link": "发送重置链接",
  "Back to login": "返回登录",
  "A reset link has been sent to your email.": "重置链接已发送至您的邮箱，请检查收件箱。",

  // Onboarding
  "Welcome to stududu!": "欢迎来到 stududu！",
  "What is your native language?": "您的母语是什么？",
  "What language do you want to learn?": "您想学习什么语言？",
  "What is your current level?": "您的当前水平如何？",
  "Next": "下一步",
  "Complete setup": "完成设置",
  "Select an option to continue": "请选择以继续",

  // Notifications & Topics & Call
  "Notifications": "通知",
  "No notifications": "暂无通知",
  "Mark all as read": "全部标记为已读",
  "Popular Topics": "热门话题",
  "Select topics you are interested in": "选择您感兴趣的话题",
  "Incoming call...": "来电...",
  "Accept": "接听",
  "Decline": "拒绝",
  "Mute": "静音",
  "Unmute": "取消静音",
  "Camera on": "开启摄像头",
  "Camera off": "关闭摄像头"
};

// Translate object recursively
function translateDeep(source) {
  if (typeof source === 'string') {
    return translations[source] || source;
  }
  if (Array.isArray(source)) {
    return source.map(translateDeep);
  }
  if (typeof source === 'object' && source !== null) {
    const result = {};
    for (const key in source) {
      result[key] = translateDeep(source[key]);
    }
    return result;
  }
  return source;
}

const zh = translateDeep(en);

// Direct overrides for nested keys where English string matching might differ
zh.langSwitcher.zh = "中文";

fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2), 'utf8');
console.log('zh.json successfully generated and fully translated at ' + zhPath);
