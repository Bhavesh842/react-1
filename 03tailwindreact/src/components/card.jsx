import React from 'react'

function Card({title, description}) {
    console.log(title);
    console.log(description);

    let cardTitle = title;
    let cardDescription = description;
  return (
   <>
   <div className="bg-white shadow-md rounded-lg p-4">

     <h2 className="text-xl font-bold text-blue-600 mb-2">{cardTitle}</h2>
     <p className="text-gray-700">{description}</p>
   </div>
   </>
  )
}

export default Card 