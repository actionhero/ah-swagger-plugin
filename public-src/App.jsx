import React, { lazy, Suspense } from 'react'
import { hot } from 'react-hot-loader'
import 'swagger-ui-react/swagger-ui.css'

function App () {
  const SwaggerComponent = lazy(() => import('swagger-ui-react'))
  return (
    <Suspense fallback={<h2 style={{ textAlign: 'center' }}>Loading Swagger Plugin...</h2>}>
      <SwaggerComponent url='/api/swagger' />
    </Suspense>
  )
}

export default hot(module)(App)
