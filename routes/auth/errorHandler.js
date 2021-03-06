const config = require('../../config')

const { Configuration, PublicApi } = require('@oryd/kratos-client')

const logger  = require('../../utils/logger')


const kratos = new PublicApi(new Configuration({ basePath: config.get('kratos').public }));

module.exports.errorHandler = (req, res, next) => {
  const error = req.query.error

  if (!error) {
    // No error was send, redirecting back to home.
    res.redirect(config.get('SITE_URL'))
    return
  }

  kratos
    .getSelfServiceError(error)
    .then(({ status, data: body }) => {
      if ('errors' in body) {
        const errorMessage = JSON.stringify(body.errors, null, 2)
        logger.warn(errorMessage)
        req.flash(
          'info',
          'We could not login/register you this time. Please, try again later. If the issue persists, please contact the site administration.'
        )
        res.redirect('/auth/registration')
        return Promise.resolve()
      }

      return Promise.reject(
        `expected body to contain "errors" but got ${JSON.stringify(
          body
        )}`
      )
    })
    .catch((err) => {
      if (!err.response) {
        next(err)
        return
      }

      if (err.response.status === 404) {
        // The error could not be found, redirect back to home.
        res.redirect(config.get('SITE_URL'))
        return
      }

      next(err)
    })
}
