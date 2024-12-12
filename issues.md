# Issues

## Migrate AWS SDK to v3
- AWS keeps warning to do so, how long before our current version is depricated and aws stops support for it altogether?

## Write integration tests and possibly unit
- many bugs found and cleaned were preventable, tests would have caught those

## Nodemon in production - Look start script in package.json
- This should not be the case, nodemon is slower and consumes too much memory and the authors advice against this

## Uploaded files are stored in memory
- `multer.memoryStorage` all over the place
- A large enough file or a couple of the depending on the backend machine's memory may crash the server

## Some duplication with s3 interfacing code and the code in general



### Fixed .env file loading
- Properly sets NODE_ENV for development environment
- Enables correct .env file loading
- Fixed super admin seeding functionality in development mode

## Feature requests / change
## Future bugs to come
