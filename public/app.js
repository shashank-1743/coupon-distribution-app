document.addEventListener('DOMContentLoaded', () => {
  const claimBtn = document.getElementById('claim-btn');
  const checkStatusBtn = document.getElementById('check-status-btn');
  const statusMessage = document.getElementById('status-message');
  const timerContainer = document.getElementById('timer-container');
  const countdown = document.getElementById('countdown');
  const couponContainer = document.getElementById('coupon-container');
  const couponCode = document.getElementById('coupon-code');
  const historyContainer = document.getElementById('history-container');
  const historyTableBody = document.getElementById('history-table-body');
  const noHistoryMessage = document.getElementById('no-history-message');
  
  let countdownInterval;
  let endTime = null; // Store the end time globally
  
  // Try to load endTime and coupon from localStorage
  const savedEndTime = localStorage.getItem('couponEndTime');
  const savedCouponCode = localStorage.getItem('claimedCouponCode');
  
  if (savedEndTime) {
    const parsedEndTime = parseInt(savedEndTime);
    // Only use the saved end time if it's in the future
    if (parsedEndTime > Date.now()) {
      endTime = parsedEndTime;
      startCountdown();
      
      // If there's a saved coupon code, display it
      if (savedCouponCode) {
        couponCode.textContent = savedCouponCode;
        couponContainer.classList.remove('d-none');
      }
    } else {
      // Clear expired end time and coupon
      localStorage.removeItem('couponEndTime');
      localStorage.removeItem('claimedCouponCode');
    }
  }
  
  // Check status on page load
  checkStatus();
  
  // Claim coupon button click handler
  claimBtn.addEventListener('click', async () => {
    try {
      claimBtn.disabled = true;
      claimBtn.textContent = 'Claiming...';
      
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Success
        statusMessage.className = 'alert alert-success';
        statusMessage.textContent = data.message;
        
        // Display coupon
        couponCode.textContent = data.coupon.code;
        couponContainer.classList.remove('d-none');
        
        // Save coupon code to localStorage
        localStorage.setItem('claimedCouponCode', data.coupon.code);
        
        // Start countdown
        checkStatus();
        
        // Hide history container if it's open
        historyContainer.classList.add('d-none');
      } else {
        // Error
        statusMessage.className = 'alert alert-danger';
        statusMessage.textContent = data.message;
        
        if (data.minutesRemaining) {
          // Set the end time based on server response
          endTime = new Date().getTime() + (data.minutesRemaining * 60 * 1000);
          // Save to localStorage
          localStorage.setItem('couponEndTime', endTime.toString());
          startCountdown();
        }
      }
    } catch (error) {
      console.error('Error claiming coupon:', error);
      statusMessage.className = 'alert alert-danger';
      statusMessage.textContent = 'An error occurred. Please try again later.';
    } finally {
      claimBtn.disabled = false;
      claimBtn.textContent = 'Claim Coupon';
    }
  });
  
  // Check status/history button click handler
  checkStatusBtn.addEventListener('click', async () => {
    // First check status to update the timer
    await checkStatus();
    
    // Then fetch and display coupon history
    await fetchCouponHistory();
  });
  
  // Function to check user's claim status
  async function checkStatus() {
    try {
      checkStatusBtn.disabled = true;
      checkStatusBtn.textContent = 'Loading...';
      
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.canClaim) {
        // User can claim
        statusMessage.className = 'alert alert-info';
        statusMessage.textContent = 'You are eligible to claim a coupon!';
        timerContainer.classList.add('d-none');
        claimBtn.disabled = false;
        
        // Reset end time and clear coupon
        endTime = null;
        localStorage.removeItem('couponEndTime');
        localStorage.removeItem('claimedCouponCode');
        couponContainer.classList.add('d-none');
        
        if (countdownInterval) {
          clearInterval(countdownInterval);
          countdownInterval = null;
        }
      } else {
        // User must wait
        statusMessage.className = 'alert alert-warning';
        statusMessage.textContent = `You need to wait before claiming another coupon.`;
        claimBtn.disabled = true;
        
        // Only set the end time if it's not already set or if the saved one has expired
        if (!endTime || endTime <= new Date().getTime()) {
          endTime = new Date().getTime() + (data.minutesRemaining * 60 * 1000);
          // Save to localStorage
          localStorage.setItem('couponEndTime', endTime.toString());
        }
        
        // Make sure the coupon is still visible if it exists
        const savedCoupon = localStorage.getItem('claimedCouponCode');
        if (savedCoupon && couponContainer.classList.contains('d-none')) {
          couponCode.textContent = savedCoupon;
          couponContainer.classList.remove('d-none');
        }
        
        // Start or continue the countdown
        startCountdown();
      }
    } catch (error) {
      console.error('Error checking status:', error);
      statusMessage.className = 'alert alert-danger';
      statusMessage.textContent = 'An error occurred while checking your status.';
    } finally {
      checkStatusBtn.disabled = false;
      checkStatusBtn.textContent = 'Check History';
    }
  }
  
  // Function to fetch and display coupon history
  async function fetchCouponHistory() {
    try {
      // Show loading state
      historyTableBody.innerHTML = '<tr><td colspan="2" class="text-center">Loading...</td></tr>';
      historyContainer.classList.remove('d-none');
      noHistoryMessage.classList.add('d-none');
      
      const response = await fetch('/api/history');
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.coupons && data.coupons.length > 0) {
          // Clear the table
          historyTableBody.innerHTML = '';
          
          // Add each coupon to the table
          data.coupons.forEach(coupon => {
            const row = document.createElement('tr');
            
            const codeCell = document.createElement('td');
            codeCell.textContent = coupon.code;
            codeCell.className = 'text-center';
            
            const dateCell = document.createElement('td');
            const claimDate = new Date(coupon.claimedAt);
            dateCell.textContent = claimDate.toLocaleString();
            dateCell.className = 'text-center';
            
            row.appendChild(codeCell);
            row.appendChild(dateCell);
            historyTableBody.appendChild(row);
          });
          
          // Show the table
          noHistoryMessage.classList.add('d-none');
        } else {
          // No coupons found
          historyTableBody.innerHTML = '';
          noHistoryMessage.classList.remove('d-none');
        }
      } else {
        // Error
        historyTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">
          ${data.message || 'Failed to load coupon history'}
        </td></tr>`;
      }
    } catch (error) {
      console.error('Error fetching coupon history:', error);
      historyTableBody.innerHTML = `<tr><td colspan="2" class="text-center text-danger">
        An error occurred while fetching your coupon history.
      </td></tr>`;
    }
  }
  
  // Function to start countdown timer
  function startCountdown() {
    // Clear any existing interval
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    
    // Show timer container
    timerContainer.classList.remove('d-none');
    
    // Update countdown immediately
    updateCountdown();
    
    // Set interval to update countdown every second
    countdownInterval = setInterval(updateCountdown, 1000);
    
    function updateCountdown() {
      const now = new Date().getTime();
      const distance = endTime - now;
      
      if (distance <= 0) {
        // Countdown finished
        clearInterval(countdownInterval);
        timerContainer.classList.add('d-none');
        localStorage.removeItem('couponEndTime');
        localStorage.removeItem('claimedCouponCode');
        couponContainer.classList.add('d-none');
        checkStatus();
        return;
      }
      
      // Calculate minutes and seconds
      const minutes = Math.floor(distance / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      // Display countdown
      countdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}); 