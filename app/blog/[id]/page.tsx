export default function BlogPost({ 
  params 
}: { 
  params: { id: string } 
}) {
  return (
    <div>
      <h1>Bài viết số {params.id}</h1>
      <p>Nội dung bài viết...</p>
    </div>
  )
}