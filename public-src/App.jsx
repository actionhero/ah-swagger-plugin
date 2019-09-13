import React, { lazy, Suspense } from 'react'
import { hot } from 'react-hot-loader'
import 'swagger-ui-react/swagger-ui.css'

function App () {
  const SwaggerComponent = lazy(() => import('swagger-ui-react'))
  return (
    <Suspense fallback={<div />}>
      <SwaggerComponent url='https://petstore.swagger.io/v2/swagger.json' />
    </Suspense>
  )
}

export default hot(module)(App)
