# Collections, Invites, Permissions & Collaboration

**Date:** 2025-01-27  
**Author:** AI Assistant  
**Status:** Planning  
**Priority:** High (Beta Launch)

## 1. Overview

This document outlines the implementation plan for collections-based collaboration features for the Moongraph beta launch. The goal is to enable simple, secure sharing of research collections while maintaining a clean user experience and fast development timeline.

## 2. Core Principles

### 2.1 Simplicity First
- Collection-level permissions only (no granular document/graph permissions in UI)
- Three privacy levels: Private, Shared, Public
- Full read/write access for all collaborators
- Business logic implementation (leverage existing RBAC database schema)

### 2.2 Security & Trust
- No accidental public exposure of private content
- Clear permission inheritance rules
- Explicit consent for sharing
- Graph visibility = most restrictive document visibility

### 2.3 Growth-Oriented
- Email-based invitations for viral growth
- Public graph sharing for discovery
- Attribution and credit system
- Future-ready for public discovery features

## 3. Terminology & Concepts

### 3.1 Collections (formerly Folders)
- **Collection**: Curated group of documents and graphs with shared permissions
- **Owner**: User who created the collection, has full admin rights
- **Collaborator**: User invited to collection, has read/write access to all contents
- **Privacy Level**: Determines who can discover and access the collection

### 3.2 Privacy Levels

| Level | Discovery | Access | Use Case |
|-------|-----------|--------|----------|
| **Private** | Owner only | Owner only | Personal research, drafts |
| **Shared** | Not discoverable | Owner + invited collaborators | Team projects, private collaboration |
| **Public** | Discoverable by anyone | Owner + invited collaborators | Open research, public projects |

### 3.3 Permission Inheritance
- **Documents**: Inherit collection privacy level
- **Graphs**: Inherit most restrictive document privacy level
- **Cross-collection graphs**: Blocked if any document is more restrictive

## 4. User Stories

### 4.1 Collection Management
```
As a researcher, I want to:
- Create collections with clear privacy levels
- Organize my documents and graphs by research topic
- Change privacy levels as my research progresses
- See at a glance who has access to my collections
```

### 4.2 Collaboration
```
As a collection owner, I want to:
- Invite collaborators via email (only owners can invite)
- Give collaborators full read/write access to collection contents
- Remove collaborators when needed
- See who has access to my collections

As a collaborator, I want to:
- Receive clear email invitations
- Understand what access I'm being granted
- Contribute documents and graphs to shared collections
- Leave collections I no longer need access to
- Know that my contributions remain if I'm removed
```

### 4.3 Public Sharing
```
As a researcher, I want to:
- Share my graphs publicly for broader impact
- Ensure I don't accidentally expose private collaborator data
- Enable anonymous users to interact with my public graphs
- Control when to make graphs public or private

As a visitor, I want to:
- Discover and interact with public graphs without signing up
- Understand the research context
- Zoom, filter, and explore graph data
- Access graphs via direct links
```

## 5. Technical Architecture

### 5.1 Database Schema (Minimal Changes)

#### 5.1.1 Existing Tables (No Changes)
- `folders` → Collections (rename in UI only)
- `user_folder_roles` → Collection collaborators
- `documents`, `graphs` → Content within collections

#### 5.1.2 New Tables

```sql
-- Collection invitations
CREATE TABLE collection_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(collection_id, email)
);

-- Public graph sharing
CREATE TABLE public_graphs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    graph_id VARCHAR NOT NULL REFERENCES graphs(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(graph_id)
);
```

### 5.2 Permission Service

```typescript
interface CollectionPermissionService {
  // Core permission checks
  hasCollectionAccess(collectionId: string, userId: string): Promise<boolean>
  getCollectionRole(collectionId: string, userId: string): Promise<'owner' | 'collaborator' | null>
  
  // Graph sharing validation
  validateGraphSharing(graphId: string, targetVisibility: 'public'): Promise<{
    canShare: boolean
    blockedDocuments?: Document[]
    reason?: string
  }>
  
  // Invitation management
  createInvitation(collectionId: string, email: string, inviterId: string): Promise<Invitation>
  acceptInvitation(token: string, userId: string): Promise<void>
  revokeInvitation(invitationId: string): Promise<void>
}
```

### 5.3 API Endpoints

#### 5.3.1 Collection Management
```
GET    /collections                    # List user's collections
POST   /collections                    # Create collection
GET    /collections/{id}               # Get collection details
PUT    /collections/{id}               # Update collection (name, description, privacy)
DELETE /collections/{id}               # Delete collection
```

#### 5.3.2 Invitations
```
POST   /collections/{id}/invitations   # Send invitation
GET    /collections/{id}/invitations   # List pending invitations
DELETE /invitations/{token}            # Cancel invitation
POST   /invitations/{token}/accept     # Accept invitation
GET    /invitations/{token}            # Get invitation details (for signup flow)
```

#### 5.3.3 Public Sharing
```
POST   /graphs/{id}/public-share       # Create public share link
DELETE /graphs/{id}/public-share       # Remove public sharing
GET    /public/graphs/{token}          # View public graph (no auth required)
```

## 6. Implementation Phases

### 6.1 Phase 1: Core Collections (Week 1)

#### 6.1.1 Frontend Changes
- [ ] Update terminology: "Folders" → "Collections" in UI
- [ ] Collection creation modal with privacy level selector
- [ ] Privacy level badges in collections list
- [ ] Permission enforcement in navigation

#### 6.1.2 Backend Changes
- [ ] Collection permission service
- [ ] Business logic for privacy level enforcement
- [ ] API endpoint updates for collections terminology

#### 6.1.3 Migration
- [ ] Automatic migration: all existing folders → private collections
- [ ] Update existing API responses to include privacy levels
- [ ] Backward compatibility for existing folder references

### 6.2 Phase 2: Email Invitations (Week 2)

#### 6.2.1 Database Setup
- [ ] Create `collection_invitations` table
- [ ] Add indexes for performance
- [ ] Set up email service integration

#### 6.2.2 Invitation System
- [ ] Email invitation templates
- [ ] Invitation token generation and validation
- [ ] Invitation acceptance flow
- [ ] Email sending service

#### 6.2.3 Collection Settings UI
- [ ] Collection settings page
- [ ] Collaborator management interface
- [ ] Invitation status tracking
- [ ] Permission indicators

### 6.3 Phase 3: Public Sharing (Week 3)

#### 6.3.1 Graph Sharing
- [ ] Public graph sharing validation
- [ ] Share token generation
- [ ] Public graph viewing (no auth)
- [ ] Attribution and credit display

#### 6.3.2 Discovery Foundation
- [ ] Public graphs table
- [ ] Basic public graph listing
- [ ] View count tracking
- [ ] Social sharing buttons

#### 6.3.3 Polish & UX
- [ ] Permission error messages
- [ ] Loading states and feedback
- [ ] Mobile responsiveness
- [ ] Performance optimization

## 7. User Experience Flows

### 7.1 Collection Creation Flow
```
1. User clicks "New Collection"
2. Modal opens with:
   - Collection name (required)
   - Description (optional)
   - Privacy level selector with explanations
3. User selects privacy level:
   - Private: "Only you can access"
   - Shared: "Invite collaborators"
   - Public: "Discoverable by anyone, invite collaborators"
4. Collection created with selected privacy level
5. User redirected to collection view
```

### 7.2 Invitation Flow
```
Owner perspective:
1. Navigate to collection settings
2. Click "Invite Collaborators"
3. Enter email addresses (comma-separated)
4. Click "Send Invitations"
5. See pending invitations list
6. Can cancel pending invitations

Invitee perspective:
1. Receive email invitation
2. Click invitation link
3. If not registered: Sign up flow
4. If registered: Login and auto-accept
5. Redirected to collection view
6. Can access all collection contents
```

### 7.3 Public Graph Sharing Flow
```
1. User creates graph in collection
2. Clicks "Share Graph Publicly"
3. System validates:
   - All documents in graph are public
   - User has permission to share
4. If valid: Generate public link
5. If invalid: Show clear error with blocked documents
6. User can share link externally
7. Anonymous visitors can view and interact with graph
```

## 8. Security Considerations

### 8.1 Permission Validation
- All API endpoints validate user permissions
- Graph sharing validates document permissions
- No accidental exposure of private content
- Clear error messages for permission denials

### 8.2 Invitation Security
- Invitation tokens expire after 7 days
- One-time use tokens
- Email verification required
- Rate limiting: 10 invitations per hour per user
- SendGrid integration for reliable email delivery
- No reminder emails for beta (keep simple)

### 8.3 Public Sharing Security
- Explicit validation before making content public
- No transitive permission escalation
- Clear attribution and ownership tracking
- Ability to revoke public sharing

## 9. Testing Strategy

### 9.1 Unit Tests
- Permission service logic
- Graph sharing validation
- Invitation token generation/validation
- Email service integration

### 9.2 Integration Tests
- End-to-end invitation flow
- Collection creation and management
- Public graph sharing and viewing
- Permission enforcement across UI

### 9.3 Manual Testing Scenarios
- Cross-browser compatibility
- Mobile responsiveness
- Email delivery and formatting
- Permission edge cases

## 10. Success Metrics

### 10.1 Beta Launch Metrics
- Collections created per user
- Successful invitations sent/accepted
- Public graphs shared
- User retention after collaboration

### 10.2 Growth Metrics
- Viral coefficient from email invitations
- Public graph discovery and engagement
- User acquisition through public content
- Collection sharing frequency

## 11. Future Enhancements (Post-Beta)

### 11.1 Advanced Permissions
- Read-only collaborator role
- Collection admin role (can invite others)
- Granular document/graph permissions
- Permission request workflows

### 11.2 Discovery Features
- Public collection browsing
- Search across public content
- Tagging and categorization
- Recommendation engine

### 11.3 Team Features
- Organization/team accounts
- Team-owned collections
- Advanced collaboration tools
- Usage analytics and insights

## 12. Risk Mitigation

### 12.1 Technical Risks
- **Email delivery issues**: Use SendGrid for reliable email delivery
- **Performance with large collections**: Implement pagination and lazy loading
- **Permission complexity**: Start simple, add complexity gradually
- **Rate limiting**: 10 invitations/hour prevents spam while allowing normal use

### 12.2 User Experience Risks
- **Confusing privacy levels**: Clear explanations and examples
- **Invitation friction**: Streamlined signup/login flow
- **Permission errors**: Helpful error messages with clear actions

### 12.3 Business Risks
- **Low adoption**: Focus on clear value proposition and ease of use
- **Privacy concerns**: Transparent privacy policy and clear controls
- **Spam/abuse**: Rate limiting and moderation tools

## 13. Implementation Timeline

### Week 1: Core Collections
- **Days 1-2**: Frontend UI updates (terminology, creation modal)
- **Days 3-4**: Backend permission service and API updates
- **Days 5-7**: Migration, testing, and polish

### Week 2: Email Invitations
- **Days 1-2**: Database schema and email service setup
- **Days 3-4**: Invitation system backend
- **Days 5-7**: Collection settings UI and testing

### Week 3: Public Sharing
- **Days 1-2**: Graph sharing validation and public viewing
- **Days 3-4**: Discovery foundation and social features
- **Days 5-7**: Polish, performance, and launch preparation

## 14. Conclusion

This implementation plan provides a clear path to launch collections-based collaboration features for the Moongraph beta. The phased approach balances feature completeness with development speed, while maintaining security and user trust.

The focus on simplicity and clear user mental models will enable rapid adoption, while the technical architecture provides a solid foundation for future enhancements.

Key success factors:
- Clear privacy level explanations
- Frictionless invitation flow
- Secure public sharing with proper validation
- Responsive and intuitive user interface

This plan positions Moongraph for successful beta launch while building the foundation for long-term growth through collaboration and public discovery features. 