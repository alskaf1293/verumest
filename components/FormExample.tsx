import React, { useState } from 'react'
import { useContext } from 'react'

const FormExample: React.FC = () => {
  const [enteredText, setEnteredText] = useState<string>('')
  const [enteredNum, setEnteredNum] = useState<number>(0)

  const onChangeNameHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredText(event.target.value)
  }

  const onChangeNumHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredNum(+event.target.value)
  }

  const submitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log(
      'submitting form with enteredText: ',
      enteredText,
      ' and enteredNum: ',
      enteredNum
    )
  }

  return (
    <form onSubmit={submitHandler} className='flex flex-col w-48'>
      <label htmlFor='input mb-2'>Task Name</label>
      <input
        type='text'
        id='input'
        className='border-2 mb-2'
        placeholder='name'
        value={enteredText}
        onChange={onChangeNameHandler}
      />
      <input
        type='number'
        id='input'
        className='border-2 mb-2'
        placeholder='number'
        value={enteredNum}
        onChange={onChangeNumHandler}
      />
      <button className='bg-blue-400 text-white text-sm px-2 py-1 hover:bg-blue-500 rounded-lg'>
        Submit
      </button>
    </form>
  )
}

export default FormExample
