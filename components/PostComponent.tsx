import React from 'react'

interface PostProps {
  author: string
  title: string
  content: string
  likes: number
}

const PostComponent = ({ author, title, content, likes }: PostProps) => {
  return (
    <div className='bg-gray-100 border-2 border-gray-400 p-4 w-[400px] relative m-4'>
      <h3 className='text-sm'>{author}</h3>
      <div className='h-px my-2 bg-gray-400'></div>
      <h2 className='text-lg'>{title}</h2>
      <p>{content}</p>
      <p className='absolute bottom-4 right-4'>likes: {likes}</p>
    </div>
  )
}

export default PostComponent
