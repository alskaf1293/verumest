import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import PostComponent from '@/components/PostComponent'
import { Post } from '@/types/types'
import { GetServerSidePropsContext } from 'next'
import { createServerSupabaseClient, User } from '@supabase/auth-helpers-nextjs'

// custom type for the fetchPosts() function supabase query
// note: could export this type and that function to separate file
// note: create hook handling fetching data
type PostsResponse = Post & {
  users: {
    first_name: string | null
    last_name: string | null
  }
}

export default function Posts({ user }: { user: User }) {
  const supabase = useSupabaseClient()
  // load posts
  const [posts, setPosts] = useState<PostsResponse[]>([])
  const [loading, setLoading] = useState(true)
  // add post
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const onTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value)
  }

  const onContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContent(event.target.value)
  }

  const fetchPosts = async () => {
    // this joins the users table with the posts table
    const { data, error } = await supabase.from('posts').select(
      `
    post_id,
    title,
    content,
    likes,
    user_id,
    users(
      first_name,
      last_name
    )
  `
    )
    // .order('likes', {
    //   ascending: true,
    // })

    if (error) {
      console.log('error', error)
      return
    }

    console.log('setting posts to', data)

    if (data) {
      setPosts(data as PostsResponse[])
      setLoading(false)
    }
  }

  const fetchPost = async (postId: string): Promise<PostsResponse> => {
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
    post_id,
    title,
    content,
    likes,
    user_id,
    users(
      first_name,
      last_name
    )
  `
      )
      .eq('post_id', postId)
      .single()

    console.log('fetch post data', data)

    return data! as PostsResponse
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {

    const postsSubscription = supabase
      .channel('custom-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        async (payload) => {
          console.log('Change received!', payload)
          const newPost = await fetchPost(payload.new.post_id)

          console.log('posts', posts)
          setPosts((posts) => [newPost, ...posts])
        }
      )
      .subscribe()

    return () => {
      if (postsSubscription) postsSubscription.unsubscribe()
    }
  }, [])

  const submitPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .insert([{ title: title, content: content, user_id: user!.id }])

    console.log('submit data', data)
    console.log('submit error', error)
  }

  const signOutSupabaseUser = async () => {
    const { error } = await supabase.auth.signOut()
    console.log('signout err', error)
  }

  const logPosts = () => {
    console.log('posts', posts)
  }

  return (
    <>
      <div className='h-screen w-full '>
        <button onClick={logPosts}>log posts</button>
        <div className='w-full py-8 grid place-items-center border-b-2 border-b-black'>
          <h1>Posts</h1>
          <button onClick={signOutSupabaseUser}>signout</button>
        </div>
        <div className='w-full py-8 flex justify-center items-center border-b-2 border-b-black gap-x-4'>
          <h2>Add Post</h2>
          <div className='flex flex-col gap-y-2'>
            <input
              type='text'
              placeholder='title'
              className='border-2 p-2'
              onChange={onTitleChange}
              value={title}
            />
            <input
              type='text'
              placeholder='content'
              className='border-2 p-2'
              onChange={onContentChange}
              value={content}
            />
            <button
              onClick={() => {
                submitPost()
              }}
              className='border-2 p-2 text-gray-600 hover:bg-gray-200'
            >
              Submit
            </button>
          </div>
        </div>
        <div className='flex flex-col w-full items-center'>
          {!loading &&
            posts.map((post) => {
              return (
                <PostComponent
                  author={post.users.first_name + ' ' + post.users.last_name}
                  title={post.title}
                  content={post.content}
                  likes={post.likes}
                  key={post.post_id}
                />
              )
            })}
          {loading && <p>Loading...</p>}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = createServerSupabaseClient(ctx)
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session)
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  }
}
