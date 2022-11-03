FROM node:16
USER node
WORKDIR /usr/src/app
COPY --chown=node:node . .

RUN npm install

ENV MONGODB_URI=mongodb+srv://fullstack_user:13nleZauFCKlLwQK@reinercluster.g2w7s.mongodb.net/friends-list-app?retryWrites=true&w=majority
ENV TEST_MONGODB_URI=mongodb+srv://fullstack_user:13nleZauFCKlLwQK@reinercluster.g2w7s.mongodb.net/friends-list-app-test?retryWrites=true&w=majority
ENV PORT=3001
ENV SECRET=999999900000

CMD npm run dev