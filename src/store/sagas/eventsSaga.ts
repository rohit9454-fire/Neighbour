import { call, put, takeLatest, takeEvery } from 'redux-saga/effects';
import { eventsService } from '../../services/eventsService';
import { Event } from '../../types';
import {
  fetchEventsRequest,
  fetchEventsSuccess,
  fetchEventsFailure,
  fetchEventsRefresh,
  createEventRequest,
  createEventSuccess,
  createEventFailure,
  markGoingRequest,
  markGoingSuccess,
  markGoingFailure,
} from '../slices/eventsSlice';

function* handleFetchEvents() {
  try {
    const events: Event[] = yield call(eventsService.getEvents);
    yield put(fetchEventsSuccess(events));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load events.';
    yield put(fetchEventsFailure(message));
  }
}

function* handleCreateEvent(action: ReturnType<typeof createEventRequest>) {
  try {
    const event: Event = yield call(eventsService.createEvent, action.payload);
    yield put(createEventSuccess(event));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create event.';
    yield put(createEventFailure(message));
  }
}

function* handleMarkGoing(action: ReturnType<typeof markGoingRequest>) {
  try {
    const event: Event = yield call(eventsService.markGoing, action.payload);
    yield put(markGoingSuccess(event));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark as going.';
    yield put(markGoingFailure({ eventId: action.payload, message }));
  }
}

export function* eventsSaga() {
  yield takeLatest(fetchEventsRequest.type, handleFetchEvents);
  yield takeLatest(fetchEventsRefresh.type, handleFetchEvents);
  yield takeLatest(createEventRequest.type, handleCreateEvent);
  yield takeEvery(markGoingRequest.type,    handleMarkGoing);
}
