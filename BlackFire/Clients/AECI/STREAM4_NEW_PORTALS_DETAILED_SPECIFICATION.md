# STREAM 4: Missing Portal Creation & Integration
**BLKFR · IZILO-PORTALS-NEW-001**

**Scope:** Weeks 2–6 (parallel with Streams 1–3) | **Effort:** 120 hours  
**Priority:** Completion of portal ecosystem  
**Dependencies:** Brand Portal complete (Phase 1), AECI Portal enhanced (Phase 2), PHP Backend live (Phase 3)  
**Deliverables:**
- Secure Command Portal (`blackfire-secure.html`, 130KB)
- Internal Ops Portal (`blackfire-internal-portal.html`, 160KB)
- Portal Hub (`blackfire-hub.html`, 100KB)
- Unified iframe overlay system + theme synchronization

---

## Overview: Three New Portals

### Portal 1: Secure Command (IZILO-SECURE-001)
**Purpose:** Encrypted incident response coordination  
**Audience:** Incident commanders, senior staff  
**Key features:** Real-time incident board, secure messaging (encrypted), document vault, contact directory, response playbooks, system status dashboard, audit logging

### Portal 2: Internal Ops / Izilo Mission Control (IZILO-OPS-INTERNAL-001)
**Purpose:** Staff scheduling, task management, internal communications  
**Audience:** Operations team, supervisors  
**Key features:** Schedule board, task manager, team chat, knowledge base, announcements, time & attendance, performance metrics

### Portal 3: Portal Hub / Launcher (IZILO-HUB-001)
**Purpose:** Central dashboard to access all portals + user preferences  
**Audience:** All staff  
**Key features:** Portal grid navigator, user profile, notifications hub, system status, help center, admin panel (admins only)

---

## PHASE 4A: Secure Command Portal Design & Implementation

**Timeline:** Weeks 2–4 | **Effort:** 35 hours

### 4A.1: Portal Specification

**File:** `blackfire-secure.html`  
**Size target:** 130KB (uncompressed)  
**Tech stack:** React 18 + TypeScript + Tailwind 3.4.1 + shadcn/ui  
**Bundling:** Single-file HTML artifact (webpack output)  
**Theme:** Dark mode mandatory (no light variant)  
**Interactions:** Keyboard shortcuts, real-time updates, minimal animations (calm under pressure)

#### Core Components

**Layout Structure:**
```
┌──────────────────────────────────────────────────────────────┐
│ 🔥 BLACKFIRE SECURE · INCIDENT COMMAND CENTER              │
│ [🏠 Home] [⚡ Incidents: 6 Active] [🔐 System Status]       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ INCIDENTS (6)  │  │ MESSAGING (4)    │  │ VAULT        │ │
│  │                │  │                  │  │              │ │
│  │ 🔴 P1: Site    │  │ [Real-time chat] │  │ [Encrypted   │ │
│  │     Down       │  │ [10 unread]      │  │  files]      │ │
│  │ 🟡 P2: Auth    │  │                  │  │              │ │
│  │ 🟢 P3: Slow    │  │ #incident-ops    │  │ [Share docs] │ │
│  │                │  │ "Starting plan"  │  │              │ │
│  │ [View All]     │  │ [+] New message  │  │ [New upload] │ │
│  └────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                               │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ PLAYBOOKS      │  │ CONTACTS         │  │ SYSTEM       │ │
│  │                │  │                  │  │              │ │
│  │ 📋 Site Down   │  │ 🚨 Emergency     │  │ All systems  │ │
│  │ 📋 DDoS Attack │  │    Contacts      │  │ ✓ (green)    │ │
│  │ 📋 Data Breach │  │                  │  │              │ │
│  │                │  │ 📞 +27 (numbers) │  │ API health   │ │
│  │ [Use Template] │  │ 📧 emails        │  │ ✓ (green)    │ │
│  └────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
│ [Keyboard shortcuts: ?] [Logout]                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4A.2: Component Deep Dive

**Incident Board:**
```jsx
interface Incident {
  id: string;
  title: string;
  severity: 'P1' | 'P2' | 'P3';  // P1 = critical, P2 = high, P3 = medium
  status: 'active' | 'resolved' | 'monitoring';
  owner: string;  // user email/name
  created_at: Date;
  updated_at: Date;
  timeline: TimelineEvent[];  // array of [time, action, actor]
  affected_systems: string[];  // ["API", "Database", "Auth"]
  impact_summary: string;  // text description
}

// Incident Card Component
<IncidentCard incident={incident}>
  <div className="incident-header">
    <span className={`severity-badge ${incident.severity}`}>
      {incident.severity === 'P1' && '🔴'}
      {incident.severity === 'P2' && '🟡'}
      {incident.severity === 'P3' && '🟢'}
      {incident.severity}
    </span>
    <h3>{incident.title}</h3>
    <span className="status-badge">{incident.status}</span>
  </div>
  
  <div className="incident-body">
    <p><strong>Owner:</strong> {incident.owner}</p>
    <p><strong>Affected:</strong> {incident.affected_systems.join(', ')}</p>
    <p><strong>Impact:</strong> {incident.impact_summary}</p>
    <p><strong>Created:</strong> {formatTime(incident.created_at)}</p>
  </div>
  
  <div className="incident-footer">
    <button onClick={() => openIncidentDetails(incident.id)}>
      View Details
    </button>
    <button onClick={() => addIncidentUpdate(incident.id)}>
      Add Update
    </button>
    <button onClick={() => closeIncident(incident.id)}>
      Resolve
    </button>
  </div>
</IncidentCard>
```

**Secure Messaging:**
```jsx
// Client-side encryption using TweetNaCl.js
import nacl from 'tweetnacl';

interface Message {
  id: string;
  channel: string;  // e.g., "#incident-ops", "#leadership"
  author: string;
  encrypted_text: string;  // base64 encoded
  timestamp: Date;
  reactions: { [emoji: string]: string[] };  // emoji -> [user1, user2]
}

// Encrypt message before sending
const encryptMessage = (plaintext, sharedKey) => {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.secretbox(
    nacl.util.decodeUTF8(plaintext),
    nonce,
    sharedKey
  );
  return {
    nonce: nacl.util.encodeBase64(nonce),
    ciphertext: nacl.util.encodeBase64(ciphertext)
  };
};

// Decrypt message on receive
const decryptMessage = (encrypted, sharedKey) => {
  const nonce = nacl.util.decodeBase64(encrypted.nonce);
  const ciphertext = nacl.util.decodeBase64(encrypted.ciphertext);
  const plaintext = nacl.secretbox.open(ciphertext, nonce, sharedKey);
  return nacl.util.encodeUTF8(plaintext);
};

// Message input & display
<div className="messaging-panel">
  <div className="message-list">
    {messages.map(msg => (
      <div key={msg.id} className="message-item">
        <div className="message-header">
          <strong>{msg.author}</strong>
          <span className="timestamp">{formatTime(msg.timestamp)}</span>
        </div>
        <div className="message-body">
          {/* Decrypt client-side; never store plaintext */}
          {decryptMessage(msg.encrypted_text, sharedKey)}
        </div>
        <div className="message-reactions">
          {Object.entries(msg.reactions).map(([emoji, users]) => (
            <button key={emoji} className="reaction-button">
              {emoji} {users.length}
            </button>
          ))}
        </div>
      </div>
    ))}
  </div>
  
  <div className="message-input">
    <textarea
      value={newMessage}
      onChange={(e) => setNewMessage(e.target.value)}
      placeholder="Type incident update..."
    />
    <button onClick={() => sendEncryptedMessage(newMessage)}>
      Send 🔒
    </button>
  </div>
</div>
```

**Document Vault:**
```jsx
interface VaultFile {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document' | 'archive';
  size: number;  // bytes
  uploaded_by: string;
  uploaded_at: Date;
  encrypted_url: string;
  access_log: { user: string; timestamp: Date }[];
}

<div className="vault-panel">
  <h3>Encrypted Document Vault</h3>
  
  <div className="file-list">
    {files.map(file => (
      <div key={file.id} className="file-item">
        <div className="file-icon">
          {file.type === 'pdf' && '📄'}
          {file.type === 'image' && '🖼️'}
          {file.type === 'archive' && '📦'}
        </div>
        <div className="file-info">
          <p className="file-name">{file.name}</p>
          <p className="file-meta">
            {(file.size / 1024).toFixed(1)}KB · 
            By {file.uploaded_by} · 
            {formatTime(file.uploaded_at)}
          </p>
        </div>
        <div className="file-actions">
          <button onClick={() => downloadFile(file.id)}>
            Download
          </button>
          <button onClick={() => viewAccessLog(file.id)}>
            Access log ({file.access_log.length})
          </button>
          <button onClick={() => deleteFile(file.id)}>
            Delete
          </button>
        </div>
      </div>
    ))}
  </div>
  
  <div className="upload-area">
    <input type="file" onChange={(e) => uploadFile(e.target.files[0])} />
    <p className="upload-note">Files are encrypted before storage</p>
  </div>
</div>
```

#### 4A.3: Implementation Checklist

**Week 2:**
- [ ] Secure Command portal scaffold created
- [ ] Dark theme finalized (no light variant)
- [ ] React + TypeScript setup
- [ ] Layout components (header, nav, main content)

**Week 3:**
- [ ] Incident board component (create, list, update, close)
- [ ] Secure messaging (TweetNaCl.js encryption)
- [ ] Document vault (upload, download, access logs)
- [ ] Contact directory (search, filter by role)

**Week 4:**
- [ ] Response playbooks (template system, copy/use)
- [ ] System status dashboard (real-time indicators)
- [ ] Audit logging (all actions tracked)
- [ ] Keyboard shortcuts (?, arrow keys, enter)
- [ ] Testing & optimization

---

## PHASE 4B: Internal Ops Portal Design & Implementation

**Timeline:** Weeks 3–5 | **Effort:** 40 hours

### 4B.1: Portal Specification

**File:** `blackfire-internal-portal.html`  
**Size target:** 160KB (uncompressed)  
**Tech stack:** React 18 + TypeScript + Tailwind 3.4.1 + shadcn/ui + date-fns  
**Bundling:** Single-file HTML artifact  
**Theme:** Dark/light toggle supported  
**Interactions:** Drag-drop (schedule), quick-filters (tasks), search (knowledge base)

#### Core Components

**Schedule Board:**
```jsx
interface Shift {
  id: string;
  staff_member: string;
  date: Date;
  start_time: string;  // "09:00"
  end_time: string;    // "17:00"
  location: string;    // "HQ", "Site A", "On-call"
  notes: string;
}

interface TimeOffRequest {
  id: string;
  staff_member: string;
  start_date: Date;
  end_date: Date;
  reason: string;  // "annual leave", "sick", "training"
  status: 'pending' | 'approved' | 'rejected';
}

// Calendar view with drag-drop scheduling
<div className="schedule-board">
  <div className="calendar-view">
    {/* Week view: Mon–Fri */}
    <div className="week-header">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
        <div key={day} className="day-header">{day}</div>
      ))}
    </div>
    
    <div className="week-body">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
        <div
          key={day}
          className="day-column"
          onDrop={(e) => handleShiftDrop(e, day)}
          onDragOver={(e) => e.preventDefault()}
        >
          {shiftsForDay(day).map(shift => (
            <div
              key={shift.id}
              className="shift-card"
              draggable
              onDragStart={(e) => handleShiftDrag(e, shift)}
            >
              <div className="shift-time">{shift.start_time}–{shift.end_time}</div>
              <div className="shift-staff">{shift.staff_member}</div>
              <div className="shift-location">{shift.location}</div>
            </div>
          ))}
          
          {/* Time off requests shown with different styling */}
          {timeOffForDay(day).map(timeOff => (
            <div key={timeOff.id} className="time-off-card">
              {timeOff.staff_member} - {timeOff.reason}
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
  
  <div className="schedule-sidebar">
    <button onClick={() => openNewShiftModal()}>
      + Add Shift
    </button>
    <button onClick={() => openTimeOffModal()}>
      + Time Off Request
    </button>
    <button onClick={() => publishSchedule()}>
      📤 Publish Schedule
    </button>
  </div>
</div>
```

**Task Manager:**
```jsx
interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'review' | 'done';
  due_date: Date;
  tags: string[];  // ["backend", "urgent", "qa"]
  comments: Comment[];
  attachment_urls: string[];
}

// Kanban board view
<div className="task-manager">
  <div className="kanban-board">
    {['todo', 'in-progress', 'review', 'done'].map(status => (
      <div key={status} className={`kanban-column kanban-${status}`}>
        <h3 className="column-header">
          {status === 'todo' && '📋 To Do'}
          {status === 'in-progress' && '⚙️ In Progress'}
          {status === 'review' && '👀 Review'}
          {status === 'done' && '✅ Done'}
          <span className="count">({tasksInStatus(status).length})</span>
        </h3>
        
        <div className="card-list">
          {tasksInStatus(status).map(task => (
            <div
              key={task.id}
              className={`task-card priority-${task.priority}`}
              onClick={() => openTaskDetails(task.id)}
            >
              <h4>{task.title}</h4>
              <p className="task-desc">{task.description}</p>
              <div className="task-meta">
                <span className="assigned-to">{task.assigned_to}</span>
                <span className="due-date">
                  {formatDate(task.due_date)}
                </span>
              </div>
              <div className="task-tags">
                {task.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
              {task.comments.length > 0 && (
                <div className="task-comments">
                  💬 {task.comments.length}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button
          className="add-task-button"
          onClick={() => openNewTaskModal(status)}
        >
          + Add task
        </button>
      </div>
    ))}
  </div>
</div>
```

**Knowledge Base:**
```jsx
interface WikiPage {
  id: string;
  title: string;
  slug: string;
  content: string;  // Markdown
  category: string;  // "procedures", "training", "troubleshooting"
  author: string;
  created_at: Date;
  updated_at: Date;
  views: number;
  helpful_count: number;
}

<div className="knowledge-base">
  <div className="kb-sidebar">
    <input
      type="search"
      placeholder="Search KB..."
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    
    <div className="category-list">
      {['procedures', 'training', 'troubleshooting'].map(cat => (
        <button
          key={cat}
          className={`category-button ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat} ({pagesInCategory(cat).length})
        </button>
      ))}
    </div>
  </div>
  
  <div className="kb-content">
    {selectedPage ? (
      <article className="wiki-page">
        <h1>{selectedPage.title}</h1>
        <div className="page-meta">
          <span>By {selectedPage.author}</span>
          <span>Updated {formatDate(selectedPage.updated_at)}</span>
          <span>👁️ {selectedPage.views} views</span>
        </div>
        
        <div className="page-body">
          {/* Render Markdown content */}
          {renderMarkdown(selectedPage.content)}
        </div>
        
        <div className="page-actions">
          <button onClick={() => markPageHelpful(selectedPage.id)}>
            👍 Helpful ({selectedPage.helpful_count})
          </button>
          <button onClick={() => editPage(selectedPage.id)}>
            ✏️ Edit
          </button>
        </div>
      </article>
    ) : (
      <div className="kb-index">
        <h2>Knowledge Base</h2>
        <p>Search or select a category to get started.</p>
        <div className="popular-pages">
          <h3>Popular Pages</h3>
          {popularPages().map(page => (
            <a
              key={page.id}
              href="#"
              onClick={() => setSelectedPage(page)}
            >
              {page.title}
            </a>
          ))}
        </div>
      </div>
    )}
  </div>
</div>
```

#### 4B.2: Implementation Checklist

**Week 3:**
- [ ] Internal Ops portal scaffold
- [ ] Dark/light theme toggle working
- [ ] React + TypeScript setup
- [ ] Layout components
- [ ] Schedule board skeleton

**Week 4:**
- [ ] Schedule board drag-drop functional
- [ ] Time off request system
- [ ] Task manager (Kanban board)
- [ ] Task CRUD operations
- [ ] Knowledge base structure

**Week 5:**
- [ ] Team chat sidebar integration
- [ ] Announcements banner
- [ ] Time & attendance tracker
- [ ] Performance metrics dashboard
- [ ] Testing & optimization

---

## PHASE 4C: Portal Hub Design & Implementation

**Timeline:** Weeks 4–5 | **Effort:** 25 hours

### 4C.1: Portal Specification

**File:** `blackfire-hub.html`  
**Size target:** 100KB (uncompressed)  
**Tech stack:** React 18 + TypeScript + Tailwind 3.4.1  
**Bundling:** Single-file HTML artifact  
**Theme:** Dark/light toggle supported  
**Interactions:** Click to open portal in iframe, search/filter, drag-reorder (optional)

#### Core Components

**Portal Grid Navigator:**
```jsx
interface PortalCard {
  id: string;
  name: string;
  description: string;
  icon: string;  // emoji or SVG path
  url: string;  // e.g., "blackfire-portal.html"
  color: string;  // hex color for card accent
  access_required: string[];  // roles that can access
  status: 'online' | 'maintenance' | 'error';
}

const portals: PortalCard[] = [
  {
    id: 'brand',
    name: 'Brand System',
    description: 'Design tokens, components, color palette',
    icon: '🎨',
    url: 'blackfire-portal.html',
    color: '#C0392B',
    access_required: ['admin', 'manager', 'designer'],
    status: 'online'
  },
  {
    id: 'aeci',
    name: 'AECI Chempark',
    description: 'Client portal for Chemhold Investments',
    icon: '📋',
    url: 'blackfire-portal-aeci-v9.html',
    color: '#E05A1A',
    access_required: ['all'],
    status: 'online'
  },
  {
    id: 'secure',
    name: 'Secure Command',
    description: 'Incident response coordination',
    icon: '🔐',
    url: 'blackfire-secure.html',
    color: '#C0392B',
    access_required: ['admin', 'manager', 'senior_tech'],
    status: 'online'
  },
  {
    id: 'ops',
    name: 'Izilo Operations',
    description: 'Scheduling, tasks, team communication',
    icon: '🏗️',
    url: 'blackfire-internal-portal.html',
    color: '#F07820',
    access_required: ['all'],
    status: 'online'
  }
];

// Portal card component
function PortalCard({ portal, onOpen }) {
  const canAccess = userHasRole(portal.access_required);
  
  return (
    <div className={`portal-card ${canAccess ? '' : 'locked'}`}>
      <div className="card-header" style={{ backgroundColor: portal.color }}>
        <span className="portal-icon">{portal.icon}</span>
        {portal.status === 'error' && (
          <span className="status-indicator error" title="Portal offline">
            ⚠️
          </span>
        )}
      </div>
      
      <div className="card-body">
        <h3>{portal.name}</h3>
        <p>{portal.description}</p>
      </div>
      
      <div className="card-footer">
        {canAccess ? (
          <button
            className="open-button"
            onClick={() => onOpen(portal)}
          >
            Open Portal →
          </button>
        ) : (
          <p className="access-denied">
            🔒 Access restricted ({portal.access_required.join(', ')})
          </p>
        )}
      </div>
    </div>
  );
}

// Main grid
<div className="portal-grid">
  <div className="grid-header">
    <h1>BlackFire Solutions</h1>
    <p>Welcome, {user.name}. Select a portal to continue.</p>
  </div>
  
  <div className="search-bar">
    <input
      type="search"
      placeholder="Search portals..."
      onChange={(e) => setSearchQuery(e.target.value)}
    />
  </div>
  
  <div className="portal-cards">
    {filteredPortals().map(portal => (
      <PortalCard
        key={portal.id}
        portal={portal}
        onOpen={(p) => openPortal(p)}
      />
    ))}
  </div>
  
  {filteredPortals().length === 0 && (
    <div className="empty-state">
      <p>No portals match your search.</p>
    </div>
  )}
</div>
```

**User Profile Panel:**
```jsx
<div className="user-profile">
  <button
    className="profile-toggle"
    onClick={() => setShowProfile(!showProfile)}
  >
    👤 {user.name}
  </button>
  
  {showProfile && (
    <div className="profile-dropdown">
      <div className="profile-header">
        <div className="avatar">{user.name.charAt(0)}</div>
        <div className="profile-info">
          <p className="name">{user.name}</p>
          <p className="email">{user.email}</p>
          <p className="role">{user.role}</p>
        </div>
      </div>
      
      <div className="profile-menu">
        <button onClick={() => openSettings()}>
          ⚙️ Settings
        </button>
        <button onClick={() => openChangePassword()}>
          🔐 Change Password
        </button>
        <button onClick={() => openAPITokens()}>
          🔑 API Tokens
        </button>
        <hr />
        <button onClick={() => logout()}>
          🚪 Logout
        </button>
      </div>
    </div>
  )}
</div>
```

**Notifications Hub:**
```jsx
<div className="notifications-hub">
  <button
    className="notifications-toggle"
    onClick={() => setShowNotifications(!showNotifications)}
  >
    🔔 Notifications
    {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
  </button>
  
  {showNotifications && (
    <div className="notifications-panel">
      <div className="notifications-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={() => markAllRead()}>Mark all read</button>
        )}
      </div>
      
      <div className="notifications-list">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`notification ${notif.read ? '' : 'unread'}`}
            onClick={() => openNotification(notif)}
          >
            <div className="notif-icon">{notif.icon}</div>
            <div className="notif-content">
              <p className="notif-title">{notif.title}</p>
              <p className="notif-message">{notif.message}</p>
              <p className="notif-time">{formatTime(notif.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}
</div>
```

#### 4C.2: Implementation Checklist

**Week 4:**
- [ ] Portal Hub scaffold created
- [ ] Dark/light theme toggle
- [ ] Portal grid layout (responsive)
- [ ] Portal card components
- [ ] Search/filter functionality

**Week 5:**
- [ ] User profile panel
- [ ] Notifications hub
- [ ] System status indicator
- [ ] Help & support section
- [ ] Admin panel (for admins only)
- [ ] iframe integration testing

---

## PHASE 4D: Integration & Cross-Portal Synchronization

**Timeline:** Weeks 5–6 | **Effort:** 20 hours

### 4D.1: iframe Overlay System

**Hub opens portals in iframe overlays:**

```html
<!-- In blackfire-hub.html -->
<div id="portal-overlay-container" style="display: none;">
  <div class="overlay-backdrop" onClick="closePortal()"></div>
  <div class="overlay-panel">
    <div class="overlay-header">
      <h3 id="overlay-title">Portal Name</h3>
      <button onClick="closePortal()" class="close-button">✕</button>
    </div>
    <iframe
      id="portal-iframe"
      src=""
      style="width: 100%; height: 100%; border: none;"
    ></iframe>
  </div>
</div>

<script>
function openPortal(portal) {
  const iframe = document.getElementById('portal-iframe');
  const container = document.getElementById('portal-overlay-container');
  const title = document.getElementById('overlay-title');
  
  iframe.src = portal.url;
  title.textContent = portal.name;
  container.style.display = 'flex';
  
  // Send theme preference to iframe
  setTimeout(() => {
    iframe.contentWindow.postMessage({
      type: 'SET_THEME',
      theme: getCurrentTheme()
    }, '*');
  }, 500);
}

function closePortal() {
  document.getElementById('portal-overlay-container').style.display = 'none';
  document.getElementById('portal-iframe').src = '';
}

// Listen for messages from portals
window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin) return;
  
  switch(event.data.type) {
    case 'THEME_CHANGED':
      applyTheme(event.data.theme);
      break;
    case 'NAVIGATION':
      // Handle portal-requested navigation
      if (event.data.portal) openPortal(event.data.portal);
      break;
  }
});
</script>
```

### 4D.2: Unified Theme System

**Theme synchronization across all portals:**

```javascript
// In each portal (blackfire-secure.html, blackfire-internal-portal.html)
window.addEventListener('message', (event) => {
  if (event.data.type === 'SET_THEME') {
    applyTheme(event.data.theme);
    localStorage.setItem('theme', event.data.theme);
  }
});

// When theme changes locally, notify parent
function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Notify parent Hub
  if (window.parent !== window) {
    window.parent.postMessage({
      type: 'THEME_CHANGED',
      theme: newTheme
    }, '*');
  }
}
```

### 4D.3: Data Synchronization

**User data shared across portals:**

```javascript
// Shared user context (available in all portals)
const SharedUserContext = {
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user') || '{}');
  },
  
  setCurrentUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    // Broadcast to other portals via postMessage
    window.parent.postMessage({
      type: 'USER_CHANGED',
      user
    }, '*');
  },
  
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.reload();
  }
};
```

### 4D.4: Cross-Portal Navigation

**User can navigate between portals via shared "back to hub" button:**

```jsx
// Button available in header of all portals
function BackToHubButton() {
  return (
    <button
      className="back-to-hub"
      onClick={() => {
        if (window.parent !== window) {
          window.parent.postMessage({
            type: 'CLOSE_PORTAL'
          }, '*');
        }
      }}
    >
      🏠 Back to Hub
    </button>
  );
}
```

### 4D.5: Testing Checklist

**Integration tests:**
- [ ] Hub loads all four portals
- [ ] Each portal loads within iframe without errors
- [ ] Theme toggle cascades to all portals
- [ ] User logout works across all portals
- [ ] Navigation between portals works
- [ ] localStorage shared correctly
- [ ] No console errors in iframes
- [ ] Mobile responsive (Hub + portals)
- [ ] Keyboard navigation working
- [ ] Accessibility (screen readers)

---

## PHASE 4E: Quality Assurance & Deployment

**Timeline:** Week 6 | **Effort:** 10 hours

### 4E.1: Comprehensive Testing

**Component-level tests:**
- Secure Command: Incident CRUD, messaging encryption, document upload
- Internal Ops: Schedule drag-drop, task state transitions, KB search
- Hub: Portal navigation, profile menu, theme toggle

**Cross-portal integration tests:**
- Open portal in iframe → works
- Switch theme → applies to all portals
- Logout in portal → logs out from all portals
- Navigate back to hub → closes portal correctly

**Performance benchmarks:**
- Hub load time < 1.5s
- Portal iframe load time < 2s
- Theme switch < 300ms
- No memory leaks (heap profiling)

**Accessibility (WCAG 2.1 AA):**
- Color contrast ≥ 4.5:1
- Keyboard navigation: Tab, Enter, Escape
- Screen reader: ARIA labels, landmarks
- Focus management: visible focus indicators

### 4E.2: Rollout Procedure

**Phased deployment:**

**Phase 1 (Monday):** Deploy Secure Command to `/mnt/user-data/outputs/`
**Phase 2 (Tuesday):** Deploy Internal Ops to `/mnt/user-data/outputs/`
**Phase 3 (Wednesday):** Deploy Hub to `/mnt/user-data/outputs/`
**Phase 4 (Thursday):** Integrated testing (all four portals via Hub)
**Phase 5 (Friday):** Production live deployment

**Rollback plan:**
- Keep previous versions available
- If critical issues: revert to previous version
- Document root cause + fix

---

## Summary: Stream 4 Deliverables

| Portal | File | Size | Hours | Status |
|--------|------|------|-------|--------|
| Secure Command | blackfire-secure.html | 130KB | 35 | Phase 4A |
| Internal Ops | blackfire-internal-portal.html | 160KB | 40 | Phase 4B |
| Portal Hub | blackfire-hub.html | 100KB | 25 | Phase 4C |
| Integration | (iframe + theme sync) | — | 20 | Phase 4D |
| QA & Deployment | (testing + rollout) | — | 10 | Phase 4E |
| **Total** | | **390KB** | **120** | **Weeks 2–6** |

---

**Status:** Ready for implementation  
**Next Step:** Begin Phase 4A with Secure Command portal scaffold