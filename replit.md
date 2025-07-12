# Blockchain Vault - File Storage Application

## Overview

This is a full-stack web application built as a blockchain-inspired file storage system. It features a React frontend with TypeScript, an Express.js backend, and uses Drizzle ORM for database management with PostgreSQL. The application allows users to upload files, verify their integrity, and manage their stored files with features like encryption and file hashing.

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theming for a blockchain-vault aesthetic
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Upload**: Multer for handling multipart/form-data
- **Storage**: Currently using in-memory storage with MemStorage class (designed to be easily swapped for database storage)
- **Security**: SHA-256 hashing for file integrity verification

### Database Schema
- **Files Table**: Stores file metadata including name, size, type, hash, encryption status, upload date, and user ID
- **Schema Definition**: Located in `shared/schema.ts` using Drizzle ORM with Zod validation

## Key Components

### Frontend Components
1. **FileUpload**: Drag-and-drop file upload with progress tracking and encryption options
2. **FileList**: Display and manage uploaded files with download and delete functionality
3. **FileVerify**: Verify file integrity using SHA-256 hashing
4. **Sidebar**: Shows recent uploads, network status, and storage usage statistics

### Backend Components
1. **Storage Interface**: Abstraction layer for file metadata storage (IStorage interface)
2. **Route Handlers**: RESTful API endpoints for file operations
3. **File Processing**: SHA-256 hashing and metadata extraction

### Shared Components
1. **Schema Definitions**: Drizzle ORM schemas and Zod validation schemas
2. **Type Definitions**: TypeScript interfaces for File and InsertFile types

## Data Flow

1. **File Upload Flow**:
   - User selects files via drag-and-drop or file picker
   - Files are processed client-side to generate SHA-256 hash
   - Optional encryption is applied if selected
   - File data and metadata are sent to backend API
   - Backend validates and stores file metadata
   - Frontend updates UI with success/error feedback

2. **File Verification Flow**:
   - User uploads a file for verification
   - System generates SHA-256 hash
   - Hash is compared against stored file records
   - Verification result is returned to user

3. **File Management Flow**:
   - Frontend fetches file list from backend API
   - Users can download, delete, or view file details
   - All operations are reflected in real-time via React Query

## External Dependencies

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **wouter**: Lightweight routing library
- **react-dropzone**: File drag-and-drop functionality
- **date-fns**: Date formatting utilities
- **lucide-react**: Icon library

### Backend Dependencies
- **express**: Web framework
- **drizzle-orm**: Type-safe ORM
- **@neondatabase/serverless**: PostgreSQL driver for Neon
- **multer**: File upload handling
- **zod**: Schema validation
- **crypto**: Built-in Node.js crypto module for hashing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking
- **tailwindcss**: Utility-first CSS framework
- **drizzle-kit**: Database migrations and introspection

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: Node.js with tsx for TypeScript execution
- **Database**: PostgreSQL (configured for Neon serverless)

### Production
- **Build Process**: 
  - Frontend: Vite builds to `dist/public`
  - Backend: esbuild bundles server code to `dist/index.js`
- **Deployment**: Single Node.js process serving both API and static files
- **Database**: PostgreSQL with connection pooling via Neon

### Key Architectural Decisions

1. **Monorepo Structure**: Frontend, backend, and shared code in a single repository for easier development and deployment
2. **TypeScript Throughout**: Full type safety from database to UI components
3. **Modular Storage**: Storage interface allows easy switching between in-memory and database storage
4. **Client-side Hashing**: SHA-256 generation on frontend reduces server load and enables offline verification
5. **Component-based UI**: Reusable components with consistent theming and accessibility
6. **Query-based State**: React Query eliminates need for complex state management
7. **Schema-first Design**: Drizzle schemas define both database structure and TypeScript types

The application is designed to be scalable, maintainable, and easily extensible for additional blockchain-like features such as distributed storage or smart contract integration.