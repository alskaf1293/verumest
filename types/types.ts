import { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Reply = Database['public']['Tables']['replies']['Row']

// Types for nested relations
export type PostWithUser = Post & {
  users: User;
}