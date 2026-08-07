
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import BibleBooksPage from './pages/BibleBooksPage'
import ChapterPage from './pages/ChapterPage'
import SermonsPage from './pages/SermonsPage'
import SermonDetailPage from './pages/SermonDetailPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/bible" element={<BibleBooksPage />} />
        <Route
          path="/bible/:book/:chapter"
          element={<ChapterPage />}
        />
        <Route path="/sermons" element={<SermonsPage />} />
        <Route
          path="/sermons/:id"
          element={<SermonDetailPage />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
