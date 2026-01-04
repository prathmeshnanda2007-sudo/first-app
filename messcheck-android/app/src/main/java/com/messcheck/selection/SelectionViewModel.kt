package com.messcheck.selection

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.messcheck.data.models.College
import com.messcheck.data.models.Mess
import com.messcheck.data.repositories.CollegeRepository
import com.messcheck.data.repositories.MessRepository
import com.messcheck.data.repositories.UserRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface SelectionUiState {
    object Loading : SelectionUiState
    object Empty : SelectionUiState
    data class Loaded(
        val colleges: List<College>,
        val messes: List<Mess>,
        val selectedCollegeId: String?,
        val selectedMessId: String?
    ) : SelectionUiState
    data class Error(val message: String) : SelectionUiState
}

sealed interface SaveState {
    object Idle : SaveState
    object Saving : SaveState
    object Success : SaveState
    data class Error(val message: String) : SaveState
}

class SelectionViewModel(
    private val collegeRepo: CollegeRepository = CollegeRepository(),
    private val messRepo: MessRepository = MessRepository(),
    private val userRepo: UserRepository = UserRepository()
) : ViewModel() {

    private val _uiState = MutableStateFlow<SelectionUiState>(SelectionUiState.Loading)
    val uiState = _uiState.asStateFlow()

    private val _saveState = MutableStateFlow<SaveState>(SaveState.Idle)
    val saveState = _saveState.asStateFlow()

    private var currentColleges: List<College> = emptyList()
    private var currentMesses: List<Mess> = emptyList()

    init {
        loadColleges()
    }

    fun loadColleges() {
        _uiState.value = SelectionUiState.Loading
        viewModelScope.launch {
            try {
                val cols = collegeRepo.getAllColleges()
                currentColleges = cols
                if (cols.isEmpty()) {
                    _uiState.value = SelectionUiState.Empty
                    return@launch
                }
                val firstCollegeId = cols.first().collegeId
                val messes = messRepo.getMessesForCollege(firstCollegeId)
                currentMesses = messes
                _uiState.value = SelectionUiState.Loaded(
                    colleges = cols,
                    messes = messes,
                    selectedCollegeId = firstCollegeId,
                    selectedMessId = messes.firstOrNull()?.messId
                )
            } catch (e: Exception) {
                _uiState.value = SelectionUiState.Error(e.message ?: "Failed to load colleges")
            }
        }
    }

    fun selectCollege(collegeId: String) {
        // find messes for this college and update state
        _uiState.value = SelectionUiState.Loading
        viewModelScope.launch {
            try {
                val messes = messRepo.getMessesForCollege(collegeId)
                currentMesses = messes
                _uiState.value = SelectionUiState.Loaded(
                    colleges = currentColleges,
                    messes = messes,
                    selectedCollegeId = collegeId,
                    selectedMessId = messes.firstOrNull()?.messId
                )
            } catch (e: Exception) {
                _uiState.value = SelectionUiState.Error(e.message ?: "Failed to load messes")
            }
        }
    }

    fun selectMess(messId: String) {
        val state = _uiState.value
        if (state is SelectionUiState.Loaded) {
            _uiState.value = state.copy(selectedMessId = messId)
        }
    }

    fun retry() {
        loadColleges()
    }

    fun saveSelection(uid: String?) {
        if (uid.isNullOrEmpty()) {
            _saveState.value = SaveState.Error("Not signed in")
            return
        }
        val state = _uiState.value
        if (state !is SelectionUiState.Loaded || state.selectedCollegeId.isNullOrEmpty() || state.selectedMessId.isNullOrEmpty()) {
            _saveState.value = SaveState.Error("Selection incomplete")
            return
        }
        _saveState.value = SaveState.Saving
        viewModelScope.launch {
            try {
                userRepo.updateCollegeAndMess(uid, state.selectedCollegeId, state.selectedMessId)
                _saveState.value = SaveState.Success
            } catch (e: Exception) {
                _saveState.value = SaveState.Error(e.message ?: "Save failed")
            }
        }
    }
}
